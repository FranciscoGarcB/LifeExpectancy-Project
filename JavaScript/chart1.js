var tooltip = d3.select("#tooltip");

// Load countries GeoJSON files
d3.json('datasets/countries.geojson').then(function(geojsonData) {
    // Selecciona el elemento donde se mostrará el mapa
    var container = d3.select("#chart1");
    var svg = container.append("svg");

    // Función para actualizar el tamaño y la proyección del mapa
    function updateMapSize() {
        var width = container.node().getBoundingClientRect().width;
        var height = container.node().getBoundingClientRect().height;

        svg.attr("width", width).attr("height", height);

        var projection = d3.geoNaturalEarth1()
            .scale(width / 6.5) // Ajusta la escala según el ancho
            .translate([width / 2, height / 2]);

        var path = d3.geoPath().projection(projection);

        svg.selectAll("path")
            .data(geojsonData.features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "country");
            
}


// Llama a updateMapSize inicialmente y cuando cambie el tamaño de la ventana
updateMapSize();
window.addEventListener("resize", updateMapSize);

// Cargar el archivo CSV y actualizar el mapa según el año seleccionado
d3.csv('datasets/LifeExpectancyUpdated.csv').then(function(lifeExpectancyData) {
    function updateMapForYear(selectedYear) {
        // Filtrar los datos por el año seleccionado
        var filteredData = lifeExpectancyData.filter(function(d) {
            return d.Year == selectedYear;
        });

        // Crear un mapa de los datos filtrados para un acceso rápido por país
        var lifeExpectancyByCountry = {};
        filteredData.forEach(function(d) {
            lifeExpectancyByCountry[d.Country] = +d['Life expectancy ']; // Asegúrate de que el nombre de la columna coincida exactamente
        });

        // Crear una escala de colores
        var colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain(d3.extent(filteredData, function(d) { return +d['Life expectancy ']; }));

        // Actualizar los colores de los países en el mapa
        svg.selectAll("path.country")
            .attr("fill", function(d) {
                return lifeExpectancyByCountry[d.properties.name] ? colorScale(lifeExpectancyByCountry[d.properties.name]) : '#ccc';
            })
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .html(d.properties.name)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            });

        // Crear la leyenda
        var legendHeight = 200, legendWidth = 20, margin = 10;
        var legend = svg.append("g")
            .attr("id", "legend")
            .attr("transform", "translate(" + (container.node().getBoundingClientRect().width - legendWidth - margin) + "," + margin + ")");

        // Definir una escala para la leyenda
        var legendScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([legendHeight, 0]);

        // Definir el eje para la leyenda
        var legendAxis = d3.axisRight(legendScale)
            .ticks(5); // Ajusta según sea necesario

        // Dibujar la leyenda
        legend.selectAll("rect")
            .data(colorScale.ticks().map(function(d, i, ticks) {
                return {
                    y0: i / ticks.length * legendHeight,
                    y1: (i + 1) / ticks.length * legendHeight,
                    z: d
                };
            }))
            .enter().append("rect")
                .attr("y", function(d) { return d.y0; })
                .attr("height", function(d) { return d.y1 - d.y0; })
                .attr("width", legendWidth)
                .style("fill", function(d) { return colorScale(d.z); });

        // Añadir el eje a la leyenda
        legend.append("g")
            .attr("transform", "translate(" + legendWidth + ",0)")
            .call(legendAxis);
            
        }

    // Escuchar cambios en el control deslizante de año
    document.getElementById('yearRange').addEventListener('input', function() {
        updateMapForYear(this.value);
    });

    // Actualizar inicialmente con el valor por defecto del control deslizante
    updateMapForYear(document.getElementById('yearRange').value);
});
});