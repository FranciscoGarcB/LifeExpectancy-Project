var tooltip = d3.select("#tooltip");

var svg;
var x, y;
var currentFilter = getTop10; // Inicializar con Top 10

// Definir márgenes en un ámbito global
var margin = {top: 20, right: 130, bottom: 20, left: 150};

function getWidth() {
    var containerWidth = document.getElementById('chart2').getBoundingClientRect().width;
    return containerWidth - margin.left - margin.right;
}

function initializeChart() {
    var width = getWidth();
    var height = 2100 - margin.top - margin.bottom; // Altura inicial para Top 10 y Bottom 10

    svg = d3.select("#chart2")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x = d3.scaleLinear().range([0, width]);
    y = d3.scaleBand().range([0, height]).padding(.1);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")");
    svg.append("g")
        .attr("class", "y-axis");
}

function updateBarChart(selectedYear) {
    d3.csv('datasets/LifeExpectancyShort.csv').then(function(data) {
        var width = getWidth();

        var filteredData = currentFilter(data.filter(d => d.Year == selectedYear));

        // Ajustar la altura y estilo del contenedor
        var height = (currentFilter === getAllData) ? 2100 : 400;
        height -= margin.top + margin.bottom;

        // Ajustar el tamaño del SVG y la escala Y
        svg.attr("height", height + margin.top + margin.bottom);
        y.range([0, height]);
        svg.select(".x-axis").attr("transform", "translate(0," + height + ")");

        // Actualizar escalas
        x.range([0, width]);
        x.domain([0, d3.max(filteredData, d => +d['Life expectancy '])]);
        y.domain(filteredData.map(d => d.Country));

        // Actualizar los ejes
        svg.select(".x-axis").call(d3.axisBottom(x));
        svg.select(".y-axis").call(d3.axisLeft(y));

        // Seleccionar y actualizar las barras
        var bars = svg.selectAll("rect")
            .data(filteredData, d => d.Country);

        // Transición para barras existentes
        bars.transition()
            .duration(800)
            .attr("y", d => y(d.Country))
            .attr("width", d => x(d['Life expectancy ']))
            .attr("height", y.bandwidth()); // Actualizar la altura

        // Agregar nuevas barras
        bars.enter().append("rect")
            .attr("x", x(0))
            .attr("y", d => y(d.Country))
            .attr("height", y.bandwidth()) // Establecer la altura
            .attr("fill", "#3081D0")
            .transition()
            .duration(800)
            .attr("width", d => x(d['Life expectancy ']));

        // Eliminar barras que ya no se necesitan
        bars.exit().remove();

        // Eventos del mouse
        svg.selectAll("rect")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block");
                tooltip.html("Country: " + d.Country + "<br/>Life Expectancy: " + d['Life expectancy '])
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
                d3.select(this).attr("fill", "#F4F27E");
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
                d3.select(this).attr("fill", "#3081D0");
            });
    });

    // Aplicar estilo scrolleable si el filtro es "Show All"
    var chartContainer = document.getElementById('chart2');
    if (currentFilter === getAllData) {
        chartContainer.classList.add('scrollable');
    } else {
        chartContainer.classList.remove('scrollable');
        chartContainer.style.maxHeight = null; // Restablecer la altura máxima
    }
}

// Funciones de Filtrado
function getTop10(data) {
    return data.sort((a, b) => b['Life expectancy '] - a['Life expectancy ']).slice(0, 10);
}

function getBottom10(data) {
    return data.sort((a, b) => a['Life expectancy '] - b['Life expectancy ']).slice(0, 10);
}

function getAllData(data) {
    return data;
}

// Manejadores de eventos para radio buttons
document.querySelectorAll('input[name="filter"]').forEach(radio => {
    radio.addEventListener('change', function() {
        switch(this.value) {
            case 'top10':
                currentFilter = getTop10;
                break;
            case 'bottom10':
                currentFilter = getBottom10;
                break;
            case 'showAll':
                currentFilter = getAllData;
                break;
        }
        updateBarChart(document.getElementById('yearRange').value);
    });
});

// Inicializar el gráfico con Top 10
initializeChart();
updateBarChart(document.getElementById('yearRange').value);

// Escuchar cambios en el control deslizante de año
document.getElementById('yearRange').addEventListener('input', function() {
    updateBarChart(this.value);
});

// Actualizar el gráfico cuando cambie el tamaño de la ventana
window.addEventListener('resize', function() {
    updateBarChart(document.getElementById('yearRange').value);
});


