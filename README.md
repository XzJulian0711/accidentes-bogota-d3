# 🚗 Accidentes de Transporte en Bogotá — Dashboard D3.js

Dashboard interactivo construido con **D3.js, HTML y CSS** para explorar y visualizar los patrones, hallazgos e insights de los accidentes de transporte reportados en Bogotá durante el periodo **2015-2025**. Forma parte del Proyecto 2 del curso **Herramientas y Visualización de Datos** de la Fundación Universitaria Los Libertadores.

## 🌐 App desplegada

👉 **[Ver dashboard en vivo](https://xzjulian0711.github.io/accidentes-bogota-d3/)**

## 📊 Descripción

Este dashboard presenta un análisis visual interactivo de accidentes de transporte en Bogotá. A diferencia de las otras dos aplicaciones del proyecto (Streamlit y Shiny), esta versión está construida completamente con tecnologías web nativas (HTML, CSS, JavaScript puro + D3.js), sin depender de ningún framework backend. Eso la hace extremadamente portable, embebible en cualquier sitio web, y de carga ultra-rápida.

### Características principales

- **5 visualizaciones interactivas** construidas a mano con D3.js
- **4 KPIs ejecutivos** que se actualizan en tiempo real
- **Filtros globales** que afectan todas las visualizaciones simultáneamente
- **Tooltips dinámicos** en cada gráfico al pasar el mouse
- **Animaciones suaves** al cargar y filtrar
- **Diseño responsive** (adaptado a móvil y desktop)
- **Paletas de color** cuidadas según los principios del curso

## 📁 Dataset

- **Fuente:** Datos Abiertos Bogotá — Secretaría Distrital de Gobierno
- **URL original:** [datosabiertos.bogota.gov.co](https://datosabiertos.bogota.gov.co/)
- **Descripción:** Registros de accidentes de transporte ocurridos en Bogotá entre 2015 y 2025, con información sobre ubicación (localidad), variables temporales (año, mes, día, hora), tipo de accidente, medio de transporte, causas, y perfil de la víctima.
- **Dimensiones:** 12,386 registros × 14 variables (tras limpieza)
- **Preprocesamiento aplicado:** normalización de nombres de columnas, reemplazo de "Bogotá" por "Sin localidad específica" en la columna localidad, creación de columnas auxiliares (`mes_num`, `tipo_dia`), eliminación de columnas no relevantes para el análisis.

## 🔍 Hallazgos principales

1. **La pandemia marcó una caída histórica, pero el rebote ha sido explosivo.** En 2020 los accidentes cayeron a 808 casos (~25% por debajo del promedio). Desde 2022 la tendencia superó los niveles pre-pandemia y 2024 registró el pico histórico con 1,330 casos.

2. **Kennedy, Engativá y Suba concentran la mayoría de accidentes con localidad específica.** Estas tres localidades reúnen más del 40% de los casos localizados, lo que sugiere priorizar políticas focalizadas de seguridad vial.

3. **Choque y atropello dominan el panorama.** Estos dos tipos representan aproximadamente el 86% de todos los accidentes, indicando que la prevención debe centrarse en estas dos dinámicas específicas.

4. **Hombres adultos son el perfil de víctima predominante.** Aproximadamente el 70% de las víctimas son hombres, y el grupo etario de 29-59 años (adultez) concentra la mayor parte de casos.

5. **La desobediencia de señales es la principal causa identificable.** Entre los casos con causa registrada, desobedecer señales lidera con ~2,300 casos, seguido de exceso de velocidad con ~1,260. Ambas son causas prevenibles ligadas al comportamiento del conductor.

## 📈 Visualizaciones implementadas

1. **Gráfico de línea y área temporal** — Muestra la evolución anual de accidentes con marcador de pandemia y puntos interactivos con tooltip. Tipo: *evolución temporal*.

2. **Barras horizontales por localidad (paleta secuencial YlOrRd)** — Compara las 19 localidades con codificación de color por intensidad y animación al cargar. Tipo: *comparación entre categorías*.

3. **Donut chart de tipos de accidente (paleta cualitativa)** — Distribución proporcional con agrupación automática de categorías pequeñas en "Otros", centro con total y leyenda dinámica. Tipo: *composición o proporciones*.

4. **Perfil demográfico combinado (dos charts)** — Pie chart de sexo y barras verticales de ciclo vital con paleta secuencial purpura. Tipo: *distribución de variables*.

5. **Top 8 causas (barras horizontales)** — Ranking de causas con paleta secuencial roja y animación de entrada. Tipo: *relación entre variables*.

Adicionalmente se incluyen **4 KPIs ejecutivos** (total de accidentes, año pico, localidad crítica, tipo predominante) que se actualizan dinámicamente con cada filtro aplicado.

## 🛠️ Tecnologías utilizadas

- **Framework:** D3.js v7 (cargado desde CDN)
- **Lenguajes:** JavaScript (ES6+), HTML5, CSS3
- **Bibliotecas:** Ninguna adicional — solo D3 y JS puro
- **Tipografía:** Inter (Google Fonts)
- **Plataforma de despliegue:** GitHub Pages
- **Control de versiones:** Git + GitHub

## 💻 Instalación y ejecución local

### Requisitos previos

- Navegador moderno (Chrome, Edge, Firefox, Safari)
- Un servidor local simple (D3 necesita HTTP para cargar archivos CSV; no funciona con doble clic al HTML)

### Opción A: Visual Studio Code con Live Server

1. Clonar el repositorio:
```bash
   git clone https://github.com/xzjulian0711/accidentes-bogota-d3.git
   cd accidentes-bogota-d3
```
2. Abrir la carpeta en VS Code
3. Instalar la extensión **Live Server** (por Ritwick Dey)
4. Clic derecho sobre `index.html` → **"Open with Live Server"**
5. El navegador abre en `http://127.0.0.1:5500/`

### Opción B: Servidor HTTP de Python

```bash
git clone https://github.com/xzjulian0711/accidentes-bogota-d3.git
cd accidentes-bogota-d3
python -m http.server 8000
```

Luego abrir en el navegador: `http://localhost:8000/`

## 📂 Estructura del proyecto

accidentes-bogota-d3/
├── index.html                          # Estructura HTML del dashboard
├── styles.css                          # Estilos visuales y responsive
├── main.js                             # Toda la lógica D3 y filtros
├── .nojekyll                           # Desactiva Jekyll en GitHub Pages
├── .gitignore                          # Archivos ignorados por Git
├── README.md                           # Este archivo
└── data/
└── accidentes_bogota_limpio.csv    # Dataset procesado

## 🎨 Principios de diseño aplicados

- **Unidad 1 (Fundamentos):** elección cuidada del tipo de gráfico según la naturaleza de los datos — barras horizontales para rankings categóricos, líneas para series temporales, donut para composición, barras verticales para distribuciones ordinales.
- **Unidad 2 (Color):** uso estratégico de paletas:
  - *Secuenciales* (YlOrRd, Purples, Reds) para variables ordenadas por intensidad
  - *Cualitativas* para categorías sin orden inherente (tipos de accidente)
  - *Contraste adecuado* para accesibilidad y lectura
  - *Colores de acento* (rojo) para resaltar hitos importantes (inicio de pandemia)
- **Unidad 3 (Diseño):** alto data-ink ratio (ejes sin bordes, grid tenue, sin decoraciones), jerarquía visual marcada (títulos grandes con hallazgo, insights subrayados), espaciado consistente mediante variables CSS, tipografía moderna (Inter), tooltips profesionales, animaciones sutiles para guiar la atención.

## 🚀 Despliegue

**URL en producción:** [https://xzjulian0711.github.io/accidentes-bogota-d3/](https://xzjulian0711.github.io/accidentes-bogota-d3/)

Desplegado automáticamente en **GitHub Pages** con conexión al repositorio. Cada push a la rama `main` actualiza el sitio público en pocos minutos.

## 🔗 Proyecto relacionado

Este dashboard forma parte de un proyecto integrado de tres aplicaciones que visualizan el mismo dataset:

- **[Streamlit App](https://accidentes-bogota-streamlit.streamlit.app)** — Para análisis rápido e iterativo (Python)
- **[Shiny App]([LINK-SHINY-AQUI])** — Para análisis estadístico detallado (R)
- **D3.js App** — Este repositorio (JavaScript)

## 👥 Autores

- **[Julian Camilo Cardenas Torres]** — [GitHub: @xzjulian0711](https://github.com/xzjulian0711)
- **[Juan Fernando Bueno Torres]** — [GitHub: @JuanFer2004](https://github.com/JuanFer2004)

## 📄 Licencia

Este proyecto es de carácter académico, desarrollado para la **Fundación Universitaria Los Libertadores** como parte del curso de Herramientas y Visualización de Datos.

---

<div align="center">
  <sub>Proyecto 2 · Abril 2026</sub>
</div>