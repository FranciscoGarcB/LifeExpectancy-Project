(function() {
    // Define the margin for the chart
    var margin = {top: 60, right: 100, bottom: 60, left: 60};

    // Function to get the width of the chart container
    function getWidth() {
        return document.getElementById('chart4').getBoundingClientRect().width;
    }

    // Calculate the initial SVG width
    var svgWidth = getWidth();
    var width = svgWidth - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    // Create an SVG element
    var svg = d3.select("#chart4")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define scales for x, y, and bubble size
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);
    var z = d3.scaleSqrt().range([2, 20]);

    // Define a color map
    var colorMap = {
        "Developed": "#3081D0",
        "Developing": "#7E1717"
    };

    // Create x-axis group
    var xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x-axis");

    // Create y-axis group
    var yAxis = svg.append("g")
        .attr("class", "y-axis");

    // Add labels for y-axis and x-axis
    var yAxisLabel = svg.append("text")
        .attr("transform", "translate(" + (-margin.left/2) + ", -30)")
        .style("text-anchor", "middle")
        .text("Years")
        .style("font-family", "Merriweather")
        .style("font-size", "12px");

    var xAxisLabel = svg.append("text")
        .attr("transform", "translate(" + (width + margin.right/4) + " ," + (height + margin.bottom/2 + 20) + ")")
        .style("text-anchor", "end")
        .attr("class", "x-axis-label")
        .style("font-family", "Merriweather");

    // Create a tooltip element
    var tooltip = d3.select("#tooltip");

    // Define a map for factor labels
    var factorLabelMap = {
        "GDP": "Gross Domestic Product per capita (in USD $)",
        "ICR": "Human Development Index in terms of income composition of resources",
        "AdultMortality": "Probability of dying between 15 and 60 years per 1000 population",
        "InfantDeaths": "Number of Infant Deaths per 1000 population",
        "Alcohol": "Consumption in litres of pure alcohol per capita (15+)",
        "HepB": "Immunization coverage among 1-year-olds (%)",
        "Polio": "Immunization coverage among 1-year-olds (%)",
        "HIV": "Deaths per 1 000 live births HIV/AIDS (0-4 years)",
        "PercExpend": "Expenditure on health as a percentage of GDP per capita (%)",
        "TotalExpend": "Expenditure on health of total government expenditure (%)"
    };

    // Function to update the bubble plot
    function updateBubblePlot(selectedYear, selectedFactor) {
        d3.csv("../datasets/Factors.csv").then(function(data) {
            var filteredData = data.filter(d => d.Year == selectedYear && !isNaN(d[selectedFactor]) && d[selectedFactor] > 0);

            var numTicks = svgWidth < 500 ? 5 : 10;
            x.domain([0, d3.max(filteredData, d => +d[selectedFactor])]).range([0, width]);
            y.domain([35, 90]);
            z.domain(d3.extent(filteredData, d => +d.Population));

            xAxis.transition().duration(800).call(d3.axisBottom(x).ticks(numTicks));
            yAxis.call(d3.axisLeft(y));

            var bubbles = svg.selectAll(".bubble")
                .data(filteredData, d => d.Country);

            bubbles.enter().append("circle")
                .attr("class", "bubble")
                .merge(bubbles)
                .transition().duration(800)
                .attr("cx", d => x(d[selectedFactor]))
                .attr("cy", d => y(d.LifeExpectancy))
                .attr("r", d => z(d.Population))
                .style("fill", d => colorMap[d.Status] || "#ccc")
                .style("opacity", 0.7)
                .style("stroke", "black")
                .style("stroke-width", 1);

            bubbles.on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .html("<b>" + d.Country + "</b>" + "<br/>" + parseFloat(d[selectedFactor]).toFixed(2))
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            });

            bubbles.exit().remove();

            // Adjust font size based on the SVG width
            var fontSize = svgWidth < 500 ? "8px" : "12px";
            var xAxisLabel = svg.select(".x-axis-label")
                .style("font-family", "Merriweather")
                .style("font-size", fontSize);
            xAxisLabel.text(factorLabelMap[selectedFactor] || selectedFactor);
        });
    }

    // Get elements for year range and factor selection
    var yearRange = document.getElementById('yearRange');
    var selectFactor = document.getElementById('selectFactor');

    // Event listener for year range input
    yearRange.addEventListener('input', function() {
        updateBubblePlot(this.value, selectFactor.value);
    });

    // Event listener for factor selection dropdown
    selectFactor.addEventListener('change', function() {
        updateBubblePlot(yearRange.value, this.value);
    });

    // Event listener for window resize
    window.addEventListener('resize', function() {
        svgWidth = getWidth();
        width = svgWidth - margin.left - margin.right;
        svg.attr("width", svgWidth);
        x.range([0, width]);
        xAxis.call(d3.axisBottom(x).ticks(numTicks));
        updateBubblePlot(yearRange.value, selectFactor.value);
    });

    // Initialize the bubble plot
    updateBubblePlot(yearRange.value, selectFactor.value);
    updateBubblePlot(yearRange.value, selectFactor.value);
})();
