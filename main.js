/* =============================================================
    DASHBOARD D3 — Accidentes de Transporte en Bogotá
   Versión final con: línea, mapa, donut, pirámide, lollipop
   ============================================================= */


// =============================================================
// 1. CONFIGURACIÓN GLOBAL
// =============================================================

const COLORS = {
    primary: '#2E86AB',
    primaryDark: '#1f5f7a',
    accent: '#C73E1D',
    accentSoft: '#F18F01',
    categorical: ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#6A994E', '#9B5DE5', '#3E92CC', '#D62246'],
    sexColors: { 'Hombre': '#3498db', 'Mujer': '#e91e63' }
};

let allData = [];
let filteredData = [];
let geoData = null;
let tooltip;

const ORDEN_CICLO = [
    '(0 a 5) Primera Infancia',
    '(6 a 11) Infancia',
    '(12 a 17) Adolescencia',
    '(18 a 28) Juventud',
    '(29 a 59) Adultez',
    '(60 y más) Persona Mayor'
];

// Mapeo de nombres TopoJSON → Dataset
const NAME_MAPPING = {
    'ANTONIO NARIÑO': 'Antonio Nariño',
    'BARRIOS UNIDOS': 'Barrios Unidos',
    'BOSA': 'Bosa',
    'CANDELARIA': 'La Candelaria',
    'CHAPINERO': 'Chapinero',
    'CIUDAD BOLIVAR': 'Ciudad Bolívar',
    'ENGATIVA': 'Engativá',
    'FONTIBON': 'Fontibón',
    'KENNEDY': 'Kennedy',
    'LOS MARTIRES': 'Los Mártires',
    'PUENTE ARANDA': 'Puente Aranda',
    'RAFAEL URIBE URIBE': 'Rafael Uribe Uribe',
    'SAN CRISTOBAL': 'San Cristóbal',
    'SANTA FE': 'Santa Fe',
    'SUBA': 'Suba',
    'SUMAPAZ': 'Sumapaz',
    'TEUSAQUILLO': 'Teusaquillo',
    'TUNJUELITO': 'Tunjuelito',
    'USAQUEN': 'Usaquén',
    'USME': 'Usme'
};


// =============================================================
// 2. CARGA DE DATOS Y GEOJSON
// =============================================================

async function loadData() {
    try {
        // Cargar dataset CSV
        const data = await d3.csv('data/accidentes_bogota_limpio.csv', d => ({
            anio: +d.anio,
            sexo: d.sexo,
            mes: d.mes,
            tipo_accidente: d.tipo_accidente,
            circunstancia: d.circunstancia,
            localidad: d.localidad,
            ciclo_vital: d.ciclo_vital
        }));

        // Cargar TopoJSON de Bogotá
        const topoData = await d3.json('data/bogota_localidades.json');
        
        // Convertir TopoJSON → GeoJSON usando topojson-client
        geoData = topojson.feature(topoData, topoData.objects.bta_localidades);
        
        // Aplicar mapeo de nombres
        geoData.features.forEach(feature => {
            const nombreOriginal = feature.properties.NOMBRE;
            feature.properties.localidad = NAME_MAPPING[nombreOriginal] || nombreOriginal;
        });

        allData = data;
        filteredData = data;

        console.log(`✅ Datos cargados: ${data.length} registros`);
        console.log(`✅ Localidades en mapa: ${geoData.features.length}`);
        
        d3.select('#loading').classed('hidden', true);
        d3.select('#main').classed('hidden', false);

        initializeFilters();
        renderAll();

    } catch (error) {
        console.error('Error cargando datos:', error);
        d3.select('#loading').html(`<p style="color:red;">Error al cargar los datos: ${error.message}</p>`);
    }
}


// =============================================================
// 3. FILTROS INTERACTIVOS
// =============================================================

function initializeFilters() {
    const tipos = [...new Set(allData.map(d => d.tipo_accidente))].sort();
    const typeSelect = d3.select('#type-filter');
    tipos.forEach(tipo => {
        typeSelect.append('option').attr('value', tipo).text(tipo);
    });

    d3.select('#year-range-start').on('input', updateFilters);
    d3.select('#year-range-end').on('input', updateFilters);
    d3.select('#sex-filter').on('change', updateFilters);
    d3.select('#type-filter').on('change', updateFilters);
}

function updateFilters() {
    let yearStart = +d3.select('#year-range-start').property('value');
    let yearEnd = +d3.select('#year-range-end').property('value');
    
    if (yearStart > yearEnd) [yearStart, yearEnd] = [yearEnd, yearStart];
    
    d3.select('#year-start').text(yearStart);
    d3.select('#year-end').text(yearEnd);

    const sexo = d3.select('#sex-filter').property('value');
    const tipo = d3.select('#type-filter').property('value');

    filteredData = allData.filter(d => {
        if (d.anio < yearStart || d.anio > yearEnd) return false;
        if (sexo !== 'todos' && d.sexo !== sexo) return false;
        if (tipo !== 'todos' && d.tipo_accidente !== tipo) return false;
        return true;
    });

    renderAll();
}


// =============================================================
// 4. RENDER MAESTRO
// =============================================================

function renderAll() {
    d3.select('#record-count').text(filteredData.length.toLocaleString('es-CO'));
    updateKPIs();
    
    renderTemporalChart();
    renderMapaChart();
    renderTiposChart();
    renderPiramideChart();
    renderCausasChart();
}


// =============================================================
// 5. KPIs
// =============================================================

function updateKPIs() {
    const total = filteredData.length;
    d3.select('#kpi-total').text(total.toLocaleString('es-CO'));

    if (total === 0) {
        d3.select('#kpi-year').text('—');
        d3.select('#kpi-year-count').text('—');
        d3.select('#kpi-locality').text('—');
        d3.select('#kpi-locality-count').text('—');
        d3.select('#kpi-type').text('—');
        return;
    }

    const porAnio = d3.rollup(filteredData, v => v.length, d => d.anio);
    const [anioPico, casosAnio] = [...porAnio.entries()].sort((a, b) => b[1] - a[1])[0];
    d3.select('#kpi-year').text(anioPico);
    d3.select('#kpi-year-count').text(`${casosAnio.toLocaleString('es-CO')} casos`);

    const localidades = filteredData.filter(d => d.localidad !== 'Sin localidad específica');
    if (localidades.length > 0) {
        const porLoc = d3.rollup(localidades, v => v.length, d => d.localidad);
        const [locTop, casosLoc] = [...porLoc.entries()].sort((a, b) => b[1] - a[1])[0];
        d3.select('#kpi-locality').text(locTop);
        d3.select('#kpi-locality-count').text(`${casosLoc.toLocaleString('es-CO')} casos`);
    } else {
        d3.select('#kpi-locality').text('—');
        d3.select('#kpi-locality-count').text('—');
    }

    const porTipo = d3.rollup(filteredData, v => v.length, d => d.tipo_accidente);
    const [tipoTop] = [...porTipo.entries()].sort((a, b) => b[1] - a[1])[0];
    d3.select('#kpi-type').text(tipoTop);
}


// =============================================================
// 6. TOOLTIP HELPERS
// =============================================================

function showTooltip(event, content) {
    tooltip.html(content)
           .classed('visible', true)
           .style('left', (event.pageX + 12) + 'px')
           .style('top', (event.pageY - 28) + 'px');
}

function hideTooltip() {
    tooltip.classed('visible', false);
}

function moveTooltip(event) {
    tooltip.style('left', (event.pageX + 12) + 'px')
           .style('top', (event.pageY - 28) + 'px');
}


// =============================================================
// 7. GRÁFICO 1: EVOLUCIÓN TEMPORAL (línea con área)
// =============================================================

function renderTemporalChart() {
    const container = '#chart-temporal';
    d3.select(container).selectAll('*').remove();

    const data = [...d3.rollup(filteredData, v => v.length, d => d.anio)]
        .map(([anio, total]) => ({ anio, total }))
        .sort((a, b) => a.anio - b.anio);

    if (data.length === 0) {
        d3.select(container).append('p').style('text-align', 'center').text('Sin datos');
        return;
    }

    const margin = { top: 20, right: 40, bottom: 50, left: 60 };
    const width = document.querySelector(container).clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(data, d => d.anio)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.total) * 1.1]).range([height, 0]);

    svg.append('g').attr('class', 'grid')
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(''));

    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d')));

    svg.append('g').attr('class', 'axis').call(d3.axisLeft(y));

    svg.append('text').attr('class', 'axis-label')
        .attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle')
        .text('Año');

    svg.append('text').attr('class', 'axis-label')
        .attr('x', -height / 2).attr('y', -45)
        .attr('transform', 'rotate(-90)').attr('text-anchor', 'middle')
        .text('Número de accidentes');

    const area = d3.area()
        .x(d => x(d.anio))
        .y0(height)
        .y1(d => y(d.total))
        .curve(d3.curveMonotoneX);

    svg.append('path').datum(data).attr('class', 'area').attr('d', area)
        .style('fill', COLORS.primary);

    const line = d3.line()
        .x(d => x(d.anio))
        .y(d => y(d.total))
        .curve(d3.curveMonotoneX);

    svg.append('path').datum(data).attr('class', 'line').attr('d', line)
        .style('stroke', COLORS.primary);

    if (x.domain()[0] <= 2020 && x.domain()[1] >= 2020) {
        svg.append('line')
            .attr('x1', x(2020)).attr('x2', x(2020))
            .attr('y1', 0).attr('y2', height)
            .style('stroke', COLORS.accent)
            .style('stroke-dasharray', '5 4')
            .style('stroke-width', 1.5);

        svg.append('text')
            .attr('x', x(2020) + 6).attr('y', 14)
            .style('fill', COLORS.accent).style('font-size', '11px').style('font-weight', '600')
            .text('Inicio pandemia');
    }

    svg.selectAll('.dot').data(data).enter()
        .append('circle').attr('class', 'dot')
        .attr('cx', d => x(d.anio)).attr('cy', d => y(d.total))
        .attr('r', 5)
        .style('fill', COLORS.primary)
        .style('stroke', 'white').style('stroke-width', 2)
        .on('mouseover', function(event, d) {
            showTooltip(event, `<strong>Año ${d.anio}</strong>${d.total.toLocaleString('es-CO')} accidentes`);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip);
}


// =============================================================
// 8. GRÁFICO 2: MAPA COROPLÉTICO DE BOGOTÁ 
// =============================================================

function renderMapaChart() {
    const container = '#chart-mapa';
    d3.select(container).selectAll('*').remove();

    if (!geoData) {
        d3.select(container).append('p').text('Mapa no disponible');
        return;
    }

    // Conteo de accidentes por localidad
    const conteoLoc = d3.rollup(
        filteredData.filter(d => d.localidad !== 'Sin localidad específica'),
        v => v.length,
        d => d.localidad
    );

    // Asignar conteo a cada feature del GeoJSON
    geoData.features.forEach(f => {
        f.properties.total = conteoLoc.get(f.properties.localidad) || 0;
    });

    const width = document.querySelector(container).clientWidth;
    const height = 600;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Proyección y path
    const projection = d3.geoMercator().fitSize([width, height], geoData);
    const path = d3.geoPath().projection(projection);

    // Escala de color (secuencial)
    const maxVal = d3.max(geoData.features, d => d.properties.total) || 1;
    const colorScale = d3.scaleSequential()
        .domain([0, maxVal])
        .interpolator(d3.interpolateYlOrRd);

    // Dibujar las localidades
    svg.selectAll('.localidad')
        .data(geoData.features)
        .enter()
        .append('path')
        .attr('class', 'localidad')
        .attr('d', path)
        .style('fill', d => d.properties.total > 0 ? colorScale(d.properties.total) : '#f5f5f5')
        .style('stroke', '#fff')
        .style('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).style('stroke', '#333').style('stroke-width', 2);
            showTooltip(event, 
                `<strong>${d.properties.localidad}</strong>` +
                `${d.properties.total.toLocaleString('es-CO')} accidentes`
            );
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', function() {
            d3.select(this).style('stroke', '#fff').style('stroke-width', 1);
            hideTooltip();
        });

    // Leyenda de colores
    const legendWidth = 250;
    const legendHeight = 12;
    const legendX = width - legendWidth - 20;
    const legendY = 20;

    const legendScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range([0, legendWidth]);

    // Gradiente
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient-mapa')
        .attr('x1', '0%').attr('x2', '100%').attr('y1', '0%').attr('y2', '0%');
    
    const stops = d3.range(0, 1.01, 0.1);
    stops.forEach(s => {
        gradient.append('stop')
            .attr('offset', `${s * 100}%`)
            .attr('stop-color', d3.interpolateYlOrRd(s));
    });

    svg.append('rect')
        .attr('x', legendX).attr('y', legendY)
        .attr('width', legendWidth).attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient-mapa)')
        .style('stroke', '#ccc');

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(${legendX}, ${legendY + legendHeight})`)
        .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format('d')));

    svg.append('text')
        .attr('x', legendX).attr('y', legendY - 6)
        .style('font-size', '11px').style('fill', '#4a4a4a').style('font-weight', '600')
        .text('Número de accidentes');
}


// =============================================================
// 9. GRÁFICO 3: TIPOS DE ACCIDENTE (donut)
// =============================================================

function renderTiposChart() {
    const container = '#chart-tipos';
    d3.select(container).selectAll('*').remove();

    let data = [...d3.rollup(filteredData, v => v.length, d => d.tipo_accidente)]
        .map(([tipo, total]) => ({ tipo, total }));

    if (data.length === 0) return;

    const totalGeneral = d3.sum(data, d => d.total);
    const umbral = totalGeneral * 0.02;
    const mayores = data.filter(d => d.total >= umbral);
    const menores = data.filter(d => d.total < umbral);
    if (menores.length > 0) {
        mayores.push({ tipo: 'Otros', total: d3.sum(menores, d => d.total) });
    }
    data = mayores.sort((a, b) => b.total - a.total);

    const width = document.querySelector(container).clientWidth;
    const height = 450;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3.select(container)
        .append('svg').attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal().domain(data.map(d => d.tipo)).range(COLORS.categorical);

    const pie = d3.pie().value(d => d.total).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(radius * 0.55).outerRadius(radius + 10);

    const slices = svg.selectAll('.slice').data(pie(data)).enter()
        .append('g').attr('class', 'slice');

    slices.append('path')
        .attr('d', arc)
        .style('fill', d => color(d.data.tipo))
        .style('stroke', 'white').style('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            const pct = ((d.data.total / totalGeneral) * 100).toFixed(1);
            showTooltip(event, `<strong>${d.data.tipo}</strong>${d.data.total.toLocaleString('es-CO')} (${pct}%)`);
            d3.select(this).transition().duration(200).attr('d', arcHover);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', function() {
            hideTooltip();
            d3.select(this).transition().duration(200).attr('d', arc);
        })
        .transition().duration(800)
        .attrTween('d', function(d) {
            const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return t => arc(interpolate(t));
        });

    svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.2em')
        .style('font-size', '14px').style('fill', '#8a8a8a').text('Total');

    svg.append('text').attr('text-anchor', 'middle').attr('dy', '1.2em')
        .style('font-size', '28px').style('font-weight', '700').style('fill', '#1a1a1a')
        .text(totalGeneral.toLocaleString('es-CO'));

    slices.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('fill', 'white').style('font-size', '12px').style('font-weight', '600')
        .style('pointer-events', 'none')
        .text(d => {
            const pct = (d.data.total / totalGeneral) * 100;
            return pct >= 5 ? `${pct.toFixed(0)}%` : '';
        });

    const legend = d3.select(container).append('div')
        .style('display', 'flex').style('flex-wrap', 'wrap')
        .style('justify-content', 'center')
        .style('gap', '16px').style('margin-top', '16px');

    data.forEach(d => {
        const item = legend.append('div')
            .style('display', 'flex').style('align-items', 'center')
            .style('gap', '6px').style('font-size', '13px');
        item.append('div')
            .style('width', '14px').style('height', '14px')
            .style('background-color', color(d.tipo)).style('border-radius', '3px');
        item.append('span').text(d.tipo);
    });
}


// =============================================================
// 10. GRÁFICO 4: PIRÁMIDE POBLACIONAL 
// =============================================================

function renderPiramideChart() {
    const container = '#chart-piramide';
    d3.select(container).selectAll('*').remove();

    const dataPyramid = ORDEN_CICLO.map(ciclo => {
        const hombres = filteredData.filter(d => d.ciclo_vital === ciclo && d.sexo === 'Hombre').length;
        const mujeres = filteredData.filter(d => d.ciclo_vital === ciclo && d.sexo === 'Mujer').length;
        return { ciclo, hombres, mujeres };
    }).filter(d => d.hombres > 0 || d.mujeres > 0);

    if (dataPyramid.length === 0) {
        d3.select(container).append('p').style('text-align', 'center').text('Sin datos demográficos');
        return;
    }

    const margin = { top: 30, right: 40, bottom: 60, left: 220 };
    const width = document.querySelector(container).clientWidth - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const maxVal = d3.max(dataPyramid, d => Math.max(d.hombres, d.mujeres));

    const xLeft = d3.scaleLinear().domain([0, maxVal]).range([width / 2, 0]);
    const xRight = d3.scaleLinear().domain([0, maxVal]).range([width / 2, width]);
    const y = d3.scaleBand().domain(dataPyramid.map(d => d.ciclo))
        .range([0, height]).padding(0.2);

    // Barras de Hombres (izquierda)
    svg.selectAll('.bar-hombre').data(dataPyramid).enter()
        .append('rect').attr('class', 'bar bar-hombre')
        .attr('x', d => xLeft(d.hombres))
        .attr('y', d => y(d.ciclo))
        .attr('width', 0)
        .attr('height', y.bandwidth())
        .style('fill', COLORS.sexColors['Hombre'])
        .on('mouseover', function(event, d) {
            showTooltip(event, `<strong>${d.ciclo}</strong>Hombres: ${d.hombres.toLocaleString('es-CO')}`);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip)
        .transition().duration(800)
        .attr('x', d => xLeft(d.hombres))
        .attr('width', d => width / 2 - xLeft(d.hombres));

    // Barras de Mujeres (derecha)
    svg.selectAll('.bar-mujer').data(dataPyramid).enter()
        .append('rect').attr('class', 'bar bar-mujer')
        .attr('x', width / 2)
        .attr('y', d => y(d.ciclo))
        .attr('width', 0)
        .attr('height', y.bandwidth())
        .style('fill', COLORS.sexColors['Mujer'])
        .on('mouseover', function(event, d) {
            showTooltip(event, `<strong>${d.ciclo}</strong>Mujeres: ${d.mujeres.toLocaleString('es-CO')}`);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip)
        .transition().duration(800)
        .attr('width', d => xRight(d.mujeres) - width / 2);

    // Eje Y (centro - etiquetas de ciclo vital)
    svg.append('g').attr('class', 'axis')
        .call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select('.domain').remove());

    // Eje X derecho (mujeres)
    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xRight).ticks(5).tickFormat(d3.format('d')));

    // Eje X izquierdo (hombres - mostramos valores positivos pero está invertido)
    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xLeft).ticks(5).tickFormat(d3.format('d')));

    // Etiquetas
    svg.append('text').style('font-size', '13px').style('font-weight', '600')
        .style('fill', COLORS.sexColors['Hombre'])
        .attr('x', width / 4).attr('y', -10).attr('text-anchor', 'middle')
        .text('← Hombres');

    svg.append('text').style('font-size', '13px').style('font-weight', '600')
        .style('fill', COLORS.sexColors['Mujer'])
        .attr('x', width * 3 / 4).attr('y', -10).attr('text-anchor', 'middle')
        .text('Mujeres →');

    svg.append('text').attr('class', 'axis-label')
        .attr('x', width / 2).attr('y', height + 45)
        .attr('text-anchor', 'middle')
        .text('Número de víctimas');
}


// =============================================================
// 11. GRÁFICO 5: LOLLIPOP CHART DE CAUSAS 
// =============================================================

function renderCausasChart() {
    const container = '#chart-causas';
    d3.select(container).selectAll('*').remove();

    const data = [...d3.rollup(
        filteredData.filter(d => d.circunstancia !== 'Sin información'),
        v => v.length,
        d => d.circunstancia
    )]
    .map(([causa, total]) => ({ causa, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

    if (data.length === 0) {
        d3.select(container).append('p').style('text-align', 'center').text('Sin causas identificadas');
        return;
    }

    data.reverse(); // para dibujar de abajo hacia arriba

    const margin = { top: 20, right: 80, bottom: 40, left: 280 };
    const width = document.querySelector(container).clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total) * 1.05])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.causa))
        .range([0, height])
        .padding(0.3);

    const color = d3.scaleSequential()
        .domain([0, d3.max(data, d => d.total)])
        .interpolator(d3.interpolateReds);

    svg.append('g').attr('class', 'grid')
        .call(d3.axisTop(x).tickSize(-height).tickFormat(''));

    // Líneas (palitos del lollipop)
    svg.selectAll('.line-pop').data(data).enter()
        .append('line').attr('class', 'line-pop')
        .attr('x1', 0).attr('x2', 0)
        .attr('y1', d => y(d.causa) + y.bandwidth() / 2)
        .attr('y2', d => y(d.causa) + y.bandwidth() / 2)
        .style('stroke', '#C73E1D').style('stroke-width', 2)
        .transition().duration(800)
        .attr('x2', d => x(d.total));

    // Círculos (piruletas)
    svg.selectAll('.dot-pop').data(data).enter()
        .append('circle').attr('class', 'dot-pop')
        .attr('cx', 0)
        .attr('cy', d => y(d.causa) + y.bandwidth() / 2)
        .attr('r', 9)
        .style('fill', d => color(d.total))
        .style('stroke', 'white').style('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).transition().duration(200).attr('r', 13);
            showTooltip(event, `<strong>${d.causa}</strong>${d.total.toLocaleString('es-CO')} casos`);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', function() {
            d3.select(this).transition().duration(200).attr('r', 9);
            hideTooltip();
        })
        .transition().duration(800)
        .attr('cx', d => x(d.total));

    // Texto con el valor al lado del círculo
    svg.selectAll('.label-pop').data(data).enter()
        .append('text').attr('class', 'label-pop')
        .attr('x', d => x(d.total) + 14)
        .attr('y', d => y(d.causa) + y.bandwidth() / 2 + 4)
        .style('font-size', '11px').style('font-weight', '600')
        .style('fill', '#1a1a1a').style('opacity', 0)
        .text(d => d.total.toLocaleString('es-CO'))
        .transition().delay(800).duration(400).style('opacity', 1);

    // Eje Y (nombres de causas)
    svg.append('g').attr('class', 'axis').call(d3.axisLeft(y));

    // Eje X (valores)
    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6));

    svg.append('text').attr('class', 'axis-label')
        .attr('x', width / 2).attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .text('Número de casos');
}


// =============================================================
// 12. INICIALIZACIÓN
// =============================================================

tooltip = d3.select('#tooltip');
loadData();

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderAll, 250);
});