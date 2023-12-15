var tooltip = d3.select("#tooltip");

// Load countries GeoJSON files
d3.json('datasets/countries.geojson').then(function(geojsonData) {
    // Select the element where the map will be displayed
    var container = d3.select("#chart1");
    var svg = container.append("svg");

    // Function to update the size and projection of the map
    function updateMapSize() {
        var width = container.node().getBoundingClientRect().width;
        var height = container.node().getBoundingClientRect().height;

        svg.attr("width", width).attr("height", height);

        var projection = d3.geoNaturalEarth1()
            .scale(width / 5.5) // Adjust scale according to width
            .translate([width / 2, height / 2]);

        var path = d3.geoPath().projection(projection);

        svg.selectAll("path")
            .data(geojsonData.features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "country");
    }

    // Call updateMapSize initially and when the window size changes
    updateMapSize();
    window.addEventListener("resize", updateMapSize);

    var legendHeight = 150; // Height of the legend
    var legendWidth = 20;
    var legendMargin = { left: 20, top: 20, right: 5, bottom: 5 };

    // Position the legend inside the SVG
    var legendXPosition = legendMargin.left;
    var legendYPosition = legendMargin.top;

    // Create the legend
    var legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate(" + legendXPosition + "," + legendYPosition + ")");

    // Define a scale for the legend
    var legendScale = d3.scaleLinear()
        .range([legendHeight, 0]);

    // Add the axis to the legend (without scale for now)
    var legendAxis = d3.axisRight(legendScale);
    legend.append("g")
        .attr("transform", "translate(" + legendWidth + ",0)")
        .attr("class", "legend-axis");

    var lifeExpectancyDataByCountry = {};

    d3.csv('datasets/LifeExpectancyUpdated.csv').then(function(lifeExpectancyData) {
        lifeExpectancyData.forEach(function(d) {
            if (!lifeExpectancyDataByCountry[d.Country]) {
                lifeExpectancyDataByCountry[d.Country] = [];
            }
            lifeExpectancyDataByCountry[d.Country].push({ year: +d.Year, value: +d['Life expectancy '] });
        });
    });

    function drawLineChart(data) {
        var margin = { top: 15, right: 15, bottom: 20, left: 30 },
            width = 150 - margin.left - margin.right,
            height = 150 - margin.top - margin.bottom;

        var svg = d3.create("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

        var x = d3.scaleLinear()
            .domain(d3.extent(data, function(d) { return d.year; }))
            .range([0, width]);

        var y = d3.scaleLinear()
            .domain([35, d3.max(data, function(d) { return d.value; })])
            .range([height, 0]);

        var line = d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(d.value); });

        svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        // Add axes to the chart
        var xAxis = d3.axisBottom(x).ticks(4).tickFormat(d3.format("d"));
        var yAxis = d3.axisLeft(y).ticks(3);

        svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + (height + margin.top) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(yAxis);

        return svg.node();
    }

    // Load the CSV file and update the map based on the selected year
    d3.csv('datasets/LifeExpectancyUpdated.csv').then(function(lifeExpectancyData) {
        function updateMapForYear(selectedYear) {
            // Filter data by the selected year
            var filteredData = lifeExpectancyData.filter(function(d) {
                return d.Year == selectedYear;
            });

            // Create a map of filtered data for quick access by country
            var lifeExpectancyByCountry = {};
            filteredData.forEach(function(d) {
                lifeExpectancyByCountry[d.Country] = +d['Life expectancy ']; // Make sure the column name matches exactly
            });

            // Create a color scale
            var colorScale = d3.scaleSequential(d3.interpolateBlues)
                .domain(d3.extent(filteredData, function(d) { return +d['Life expectancy ']; }));

            // Update the colors of countries on the map
            svg.selectAll("path.country")
                .transition() // Inicia la transición
        .       duration(200) // Duración de la transición en milisegundos
                .attr("fill", function(d) {
                    var countryName = d.properties.name;
                    var lifeExpectancy = lifeExpectancyByCountry[countryName];
                    return lifeExpectancy ? colorScale(lifeExpectancy) : '#ccc';
                })

            // Update the colors of countries on the map
            svg.selectAll("path.country")
                .on("mouseover", function(event, d) {
                    var countryName = d.properties.name;
                    var lifeExpectancy = lifeExpectancyByCountry[countryName];
                    var tooltipText = countryName;

                    if (lifeExpectancy) {
                        tooltipText += ": " + lifeExpectancy.toFixed(2) + " years";
                    } else {
                        tooltipText += ": No data";
                    }

                    var lineChartData = lifeExpectancyDataByCountry[countryName];
                    if (lineChartData) {
                        var lineChart = drawLineChart(lineChartData);
                        tooltip.html(tooltipText)
                            .style("display", "block")
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY + 10) + "px")
                            .node().appendChild(lineChart);
                    }
                })
                .on("mouseout", function() {
                    tooltip.style("display", "none").html("");
                });

            // Update the legend scale
            legendScale.domain(d3.extent(filteredData, function(d) { return +d['Life expectancy ']; }));

            // Invert the way legend rectangles' values are calculated
            var legendRects = legend.selectAll("rect")
                .data(colorScale.ticks().map(function(d, i, ticks) {
                    return {
                        y0: legendHeight - (i + 1) / ticks.length * legendHeight,
                        y1: legendHeight - i / ticks.length * legendHeight,
                        z: d
                    };
                }));

            legendRects.enter().append("rect")
                .merge(legendRects)
                .attr("y", function(d) { return d.y0; })
                .attr("height", function(d) { return d.y1 - d.y0; })
                .attr("width", legendWidth)
                .style("fill", function(d) { return colorScale(d.z); });

            legendRects.exit().remove();

            // Update the legend axis
            legend.select(".legend-axis").call(legendAxis);
        }

        // Listen for changes in the year slider
        document.getElementById('yearRange').addEventListener('input', function() {
            updateMapForYear(this.value);
        });

        // Initially update with the default value of the slider
        updateMapForYear(document.getElementById('yearRange').value);
    });
});
