/* =============================================================
   🚗 DASHBOARD D3 — Accidentes de Transporte en Bogotá
   
   Estructura del código:
   1. Configuración global
   2. Carga y procesamiento de datos
   3. Filtros interactivos
   4. KPIs
   5. Los 5 gráficos (uno por insight)
   6. Inicialización
   ============================================================= */


// =============================================================
// 1. CONFIGURACIÓN GLOBAL
// =============================================================

// Paleta de colores (coinciden con el CSS)
const COLORS = {
    primary: '#2E86AB',
    primaryDark: '#1f5f7a',
    accent: '#C73E1D',
    accentSoft: '#F18F01',
    categorical: ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#6A994E', '#9B5DE5', '#3E92CC', '#D62246'],
    sequential: d3.interpolateYlOrRd,  // amarillo → rojo
    sexColors: { 'Hombre': '#3498db', 'Mujer': '#e91e63' }
};

// Variables globales donde se guarda el estado de la app
let allData = [];          // dataset completo
let filteredData = [];     // dataset filtrado según selecciones del usuario
let tooltip;               // referencia al tooltip global

// Orden lógico para variables categóricas
const ORDEN_CICLO = [
    '(0 a 5) Primera Infancia',
    '(6 a 11) Infancia',
    '(12 a 17) Adolescencia',
    '(18 a 28) Juventud',
    '(29 a 59) Adultez',
    '(60 y más) Persona Mayor'
];


// =============================================================
// 2. CARGA Y PROCESAMIENTO DE DATOS
// =============================================================

async function loadData() {
    try {
        // D3 tiene su propio lector de CSVs
        const data = await d3.csv('data/accidentes_bogota_limpio.csv', d => ({
            anio: +d.anio,                          // convertir a número
            codigo_localidad: +d.codigo_localidad,
            casos: +d.casos,
            mes_num: +d.mes_num,
            sexo: d.sexo,
            mes: d.mes,
            dia_semana: d.dia_semana,
            rango_hora: d.rango_hora,
            tipo_accidente: d.tipo_accidente,
            circunstancia: d.circunstancia,
            condicion_victima: d.condicion_victima,
            medio_transporte: d.medio_transporte,
            localidad: d.localidad,
            ciclo_vital: d.ciclo_vital,
            tipo_dia: d.tipo_dia
        }));

        allData = data;
        filteredData = data;

        console.log(`✅ Datos cargados: ${data.length} registros`);
        
        // Ocultar loading y mostrar contenido
        d3.select('#loading').classed('hidden', true);
        d3.select('#main').classed('hidden', false);

        // Inicializar todo
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
    // Llenar el dropdown de tipos de accidente con los valores únicos
    const tipos = [...new Set(allData.map(d => d.tipo_accidente))].sort();
    const typeSelect = d3.select('#type-filter');
    tipos.forEach(tipo => {
        typeSelect.append('option').attr('value', tipo).text(tipo);
    });

    // Event listeners para los filtros
    d3.select('#year-range-start').on('input', updateFilters);
    d3.select('#year-range-end').on('input', updateFilters);
    d3.select('#sex-filter').on('change', updateFilters);
    d3.select('#type-filter').on('change', updateFilters);
}

function updateFilters() {
    // Leer valores actuales de los filtros
    let yearStart = +d3.select('#year-range-start').property('value');
    let yearEnd = +d3.select('#year-range-end').property('value');
    
    // Asegurar que start <= end
    if (yearStart > yearEnd) [yearStart, yearEnd] = [yearEnd, yearStart];
    
    // Actualizar las etiquetas visuales del rango
    d3.select('#year-start').text(yearStart);
    d3.select('#year-end').text(yearEnd);

    const sexo = d3.select('#sex-filter').property('value');
    const tipo = d3.select('#type-filter').property('value');

    // Aplicar los filtros
    filteredData = allData.filter(d => {
        if (d.anio < yearStart || d.anio > yearEnd) return false;
        if (sexo !== 'todos' && d.sexo !== sexo) return false;
        if (tipo !== 'todos' && d.tipo_accidente !== tipo) return false;
        return true;
    });

    renderAll();
}


// =============================================================
// 4. FUNCIÓN MAESTRA: RENDERIZA TODO
// =============================================================

function renderAll() {
    // Actualizar contador de registros
    d3.select('#record-count').text(filteredData.length.toLocaleString('es-CO'));
    
    // Actualizar KPIs
    updateKPIs();
    
    // Renderizar cada gráfico
    renderTemporalChart();
    renderLocalidadesChart();
    renderTiposChart();
    renderSexoChart();
    renderEdadChart();
    renderCausasChart();
}


// =============================================================
// 5. KPIs (indicadores principales)
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

    // Año pico
    const porAnio = d3.rollup(filteredData, v => v.length, d => d.anio);
    const [anioPico, casosAnio] = [...porAnio.entries()].sort((a, b) => b[1] - a[1])[0];
    d3.select('#kpi-year').text(anioPico);
    d3.select('#kpi-year-count').text(`${casosAnio.toLocaleString('es-CO')} casos`);

    // Localidad crítica (excluyendo "Sin localidad específica")
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

    // Tipo predominante
    const porTipo = d3.rollup(filteredData, v => v.length, d => d.tipo_accidente);
    const [tipoTop, _] = [...porTipo.entries()].sort((a, b) => b[1] - a[1])[0];
    d3.select('#kpi-type').text(tipoTop);
}


// =============================================================
// 6. UTILIDADES DE TOOLTIP
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

    // Agregar por año
    const data = [...d3.rollup(filteredData, v => v.length, d => d.anio)]
        .map(([anio, total]) => ({ anio, total }))
        .sort((a, b) => a.anio - b.anio);

    if (data.length === 0) {
        d3.select(container).append('p').style('text-align', 'center').text('Sin datos');
        return;
    }

    // Dimensiones
    const margin = { top: 20, right: 40, bottom: 50, left: 60 };
    const width = document.querySelector(container).clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.anio))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total) * 1.1])
        .range([height, 0]);

    // Grid horizontal
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(''));

    // Ejes
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d')));

    svg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y));

    // Etiquetas de ejes
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .text('Año');

    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Número de accidentes');

    // Área sombreada bajo la línea
    const area = d3.area()
        .x(d => x(d.anio))
        .y0(height)
        .y1(d => y(d.total))
        .curve(d3.curveMonotoneX);

    svg.append('path')
        .datum(data)
        .attr('class', 'area')
        .attr('d', area)
        .style('fill', COLORS.primary);

    // Línea
    const line = d3.line()
        .x(d => x(d.anio))
        .y(d => y(d.total))
        .curve(d3.curveMonotoneX);

    svg.append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', COLORS.primary);

    // Línea vertical de pandemia (si 2020 está en el rango)
    if (x.domain()[0] <= 2020 && x.domain()[1] >= 2020) {
        svg.append('line')
            .attr('x1', x(2020)).attr('x2', x(2020))
            .attr('y1', 0).attr('y2', height)
            .style('stroke', COLORS.accent)
            .style('stroke-dasharray', '5 4')
            .style('stroke-width', 1.5);

        svg.append('text')
            .attr('x', x(2020) + 6)
            .attr('y', 14)
            .style('fill', COLORS.accent)
            .style('font-size', '11px')
            .style('font-weight', '600')
            .text('Inicio pandemia');
    }

    // Puntos interactivos
    svg.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.anio))
        .attr('cy', d => y(d.total))
        .attr('r', 5)
        .style('fill', COLORS.primary)
        .style('stroke', 'white')
        .style('stroke-width', 2)
        .on('mouseover', function(event, d) {
            showTooltip(event, `<strong>Año ${d.anio}</strong>${d.total.toLocaleString('es-CO')} accidentes`);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip);
}


// =============================================================
// 8. GRÁFICO 2: LOCALIDADES (barras horizontales)
// =============================================================

function renderLocalidadesChart() {
    const container = '#chart-localidades';
    d3.select(container).selectAll('*').remove();

    // Agregar y ordenar, excluyendo "Sin localidad específica"
    const data = [...d3.rollup(
        filteredData.filter(d => d.localidad !== 'Sin localidad específica'),
        v => v.length,
        d => d.localidad
    )]
    .map(([localidad, total]) => ({ localidad, total }))
    .sort((a, b) => b.total - a.total);

    if (data.length === 0) {
        d3.select(container).append('p').style('text-align', 'center').text('Sin datos con localidad específica');
        return;
    }

    const margin = { top: 20, right: 40, bottom: 40, left: 140 };
    const width = document.querySelector(container).clientWidth - margin.left - margin.right;
    const height = Math.max(400, data.length * 28) - margin.top - margin.bottom;

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
        .domain(data.map(d => d.localidad))
        .range([0, height])
        .padding(0.2);

    // Paleta secuencial (más oscuro = más accidentes)
    const colorScale = d3.scaleSequential()
        .domain([0, d3.max(data, d => d.total)])
        .interpolator(d3.interpolateYlOrRd);

    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisTop(x).tickSize(-height).tickFormat(''));

    // Barras
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.localidad))
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .style('fill', d => colorScale(d.total))
        .on('mouseover', function(event, d) {
            showTooltip(event, `<strong>${d.localidad}</strong>${d.total.toLocaleString('es-CO')} accidentes`);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip)
        .transition()
        .duration(800)
        .attr('width', d => x(d.total));

    // Eje Y (nombres)
    svg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y));

    // Eje X (números)
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6));

    // Etiqueta del eje X
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .text('Número de accidentes');
}


// =============================================================
// 9. GRÁFICO 3: TIPOS DE ACCIDENTE (donut chart)
// =============================================================

function renderTiposChart() {
    const container = '#chart-tipos';
    d3.select(container).selectAll('*').remove();

    let data = [...d3.rollup(filteredData, v => v.length, d => d.tipo_accidente)]
        .map(([tipo, total]) => ({ tipo, total }));

    if (data.length === 0) return;

    // Agrupar categorías muy pequeñas (< 2%) en "Otros"
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
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.tipo))
        .range(COLORS.categorical);

    const pie = d3.pie()
        .value(d => d.total)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(radius * 0.55)   // agujero del donut
        .outerRadius(radius);

    const arcHover = d3.arc()
        .innerRadius(radius * 0.55)
        .outerRadius(radius + 10);

    // Segmentos
    const slices = svg.selectAll('.slice')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'slice');

    slices.append('path')
        .attr('d', arc)
        .style('fill', d => color(d.data.tipo))
        .style('stroke', 'white')
        .style('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            const pct = ((d.data.total / totalGeneral) * 100).toFixed(1);
            showTooltip(event, `<strong>${d.data.tipo}</strong>${d.data.total.toLocaleString('es-CO')} accidentes (${pct}%)`);
            d3.select(this).transition().duration(200).attr('d', arcHover);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', function() {
            hideTooltip();
            d3.select(this).transition().duration(200).attr('d', arc);
        })
        .transition()
        .duration(800)
        .attrTween('d', function(d) {
            const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return t => arc(interpolate(t));
        });

    // Texto del centro
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .style('font-size', '14px')
        .style('fill', '#8a8a8a')
        .text('Total');

    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .style('font-size', '28px')
        .style('font-weight', '700')
        .style('fill', '#1a1a1a')
        .text(totalGeneral.toLocaleString('es-CO'));

    // Etiquetas con porcentaje sobre los sectores grandes
    slices.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('pointer-events', 'none')
        .text(d => {
            const pct = (d.data.total / totalGeneral) * 100;
            return pct >= 5 ? `${pct.toFixed(0)}%` : '';
        });

    // Leyenda abajo
    const legend = d3.select(container).append('div')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('justify-content', 'center')
        .style('gap', '16px')
        .style('margin-top', '16px');

    data.forEach(d => {
        const item = legend.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '6px')
            .style('font-size', '13px');
        item.append('div')
            .style('width', '14px').style('height', '14px')
            .style('background-color', color(d.tipo))
            .style('border-radius', '3px');
        item.append('span').text(d.tipo);
    });
}


// =============================================================
// 10. GRÁFICO 4A: DISTRIBUCIÓN POR SEXO (pie chart)
// =============================================================

function renderSexoChart() {
    const container = '#chart-sexo';
    d3.select(container).selectAll('*').remove();

    const data = [...d3.rollup(filteredData, v => v.length, d => d.sexo)]
        .map(([sexo, total]) => ({ sexo, total }));

    if (data.length === 0) return;

    const totalGeneral = d3.sum(data, d => d.total);
    const width = document.querySelector(container).clientWidth;
    const height = 350;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value(d => d.total).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);

    const slices = svg.selectAll('.slice')
        .data(pie(data))
        .enter()
        .append('g');

    slices.append('path')
        .attr('d', arc)
        .style('fill', d => COLORS.sexColors[d.data.sexo] || '#999')
        .style('stroke', 'white')
        .style('stroke-width', 2)
        .on('mouseover', function(event, d) {
            const pct = ((d.data.total / totalGeneral) * 100).toFixed(1);
            showTooltip(event, `<strong>${d.data.sexo}</strong>${d.data.total.toLocaleString('es-CO')} (${pct}%)`);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip);

    slices.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text(d => {
            const pct = (d.data.total / totalGeneral) * 100;
            return `${pct.toFixed(0)}%`;
        });

    // Título interno
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-1em')
        .style('font-size', '12px')
        .style('fill', '#8a8a8a')
        .attr('y', -radius - 10)
        .text('Por sexo');
}


// =============================================================
// 11. GRÁFICO 4B: CICLO VITAL (barras verticales)
// =============================================================

function renderEdadChart() {
    const container = '#chart-edad';
    d3.select(container).selectAll('*').remove();

    const data = ORDEN_CICLO.map(ciclo => {
        const total = filteredData.filter(d => d.ciclo_vital === ciclo).length;
        return { ciclo, total };
    }).filter(d => d.total > 0);

    if (data.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const width = document.querySelector(container).clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.ciclo))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total) * 1.1])
        .range([height, 0]);

    const color = d3.scaleSequential()
        .domain([0, d3.max(data, d => d.total)])
        .interpolator(d3.interpolatePurples);

    svg.append('g').attr('class', 'grid')
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(''));

    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.ciclo))
        .attr('width', x.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .style('fill', d => color(d.total))
        .on('mouseover', function(event, d) {
            showTooltip(event, `<strong>${d.ciclo}</strong>${d.total.toLocaleString('es-CO')} víctimas`);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip)
        .transition()
        .duration(800)
        .attr('y', d => y(d.total))
        .attr('height', d => height - y(d.total));

    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('transform', 'rotate(-30)')
        .attr('dx', '-0.5em')
        .attr('dy', '0.5em')
        .style('font-size', '10px');

    svg.append('g').attr('class', 'axis').call(d3.axisLeft(y));
}


// =============================================================
// 12. GRÁFICO 5: CAUSAS (barras horizontales)
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
    .slice(0, 8);  // Top 8

    if (data.length === 0) {
        d3.select(container).append('p').style('text-align', 'center').text('Sin causas identificadas');
        return;
    }

    const margin = { top: 20, right: 40, bottom: 40, left: 280 };
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
        .padding(0.2);

    const color = d3.scaleSequential()
        .domain([0, d3.max(data, d => d.total)])
        .interpolator(d3.interpolateReds);

    svg.append('g').attr('class', 'grid')
        .call(d3.axisTop(x).tickSize(-height).tickFormat(''));

    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.causa))
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .style('fill', d => color(d.total))
        .on('mouseover', function(event, d) {
            showTooltip(event, `<strong>${d.causa}</strong>${d.total.toLocaleString('es-CO')} casos`);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip)
        .transition()
        .duration(800)
        .attr('width', d => x(d.total));

    svg.append('g').attr('class', 'axis').call(d3.axisLeft(y));

    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6));

    svg.append('text').attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .text('Número de casos');
}


// =============================================================
// 13. INICIALIZACIÓN
// =============================================================

// Inicializar el tooltip global
tooltip = d3.select('#tooltip');

// Cargar los datos y arrancar todo
loadData();

// Al redimensionar la ventana, re-renderizar (responsive)
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderAll, 250);
});