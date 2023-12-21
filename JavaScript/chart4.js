(function() {
    var margin = {top: 10, right: 100, bottom: 40, left: 50};

    function getWidth() {
        return document.getElementById('chart4').getBoundingClientRect().width;
    }

    var svgWidth = getWidth();
    var width = svgWidth - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    var svg = d3.select("#chart4")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);
    var z = d3.scaleSqrt().range([2, 20]);

    var colorMap = {
        "Developed": "#3081D0",
        "Developing": "#7E1717"
    };

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x-axis");

    svg.append("g")
        .attr("class", "y-axis");

    var tooltip = d3.select("#tooltip");

    function updateBubblePlot(selectedYear, selectedFactor) {
        d3.csv("../datasets/Factors.csv").then(function(data) {
            var filteredData = data.filter(d => d.Year == selectedYear && !isNaN(d[selectedFactor]) && d[selectedFactor] > 0);

            x.domain([0, d3.max(filteredData, d => +d[selectedFactor])]).range([0, width]);
            y.domain([35, 90]);
            z.domain(d3.extent(filteredData, d => +d.Population));

            svg.select(".x-axis").transition().duration(800).call(d3.axisBottom(x));
            svg.select(".y-axis").call(d3.axisLeft(y));

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
                        .html(d.Country + "<br/>" + selectedFactor + ": " + parseFloat(d[selectedFactor]).toFixed(2))
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
        });
    }

    var yearRange = document.getElementById('yearRange');
    var selectFactor = document.getElementById('selectFactor');

    yearRange.addEventListener('input', function() {
        updateBubblePlot(this.value, selectFactor.value);
    });

    selectFactor.addEventListener('change', function() {
        updateBubblePlot(yearRange.value, this.value);
    });

    window.addEventListener('resize', function() {
        svgWidth = getWidth();
        width = svgWidth - margin.left - margin.right;
        svg.attr("width", svgWidth);
        x.range([0, width]);
        svg.select(".x-axis").call(d3.axisBottom(x));
        updateBubblePlot(yearRange.value, selectFactor.value);
    });

    updateBubblePlot(yearRange.value, selectFactor.value);
})();
