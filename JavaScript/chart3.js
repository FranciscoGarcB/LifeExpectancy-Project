(function() {
    var container = d3.select("#chart3");
    var containerWidth = container.node().getBoundingClientRect().width;

    var svgWidth = containerWidth * 0.9; // 80% del ancho del contenedor
    var margin = {top: 10, right: 30, bottom: 30, left: (containerWidth - svgWidth) / 1.5}, // Ajuste del margen izquierdo para centrar
        width = svgWidth - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
    var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(["Developed", "Developing"])
        .paddingInner(1)
        .paddingOuter(.5);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x-axis");

    var y = d3.scaleLinear()
        .range([height, 0]);
    svg.append("g")
        .attr("class", "y-axis");

    var colorMap = { "Developed": "#3081D0", "Developing": "#7E1717" };
    var tooltip = d3.select("#tooltip");

    function updateBoxPlot(selectedYear) {
        d3.csv("../datasets/DevelopedLE.csv").then(function(data) {
            var filteredData = data.filter(d => d.Year == selectedYear);

            var sumstat = d3.rollup(filteredData, function(d) {
                q1 = d3.quantile(d.map(g => g.LifeExpectancy).sort(d3.ascending), .25);
                median = d3.quantile(d.map(g => g.LifeExpectancy).sort(d3.ascending), .5);
                q3 = d3.quantile(d.map(g => g.LifeExpectancy).sort(d3.ascending), .75);
                interQuantileRange = q3 - q1;
                min = q1 - 1.5 * interQuantileRange;
                max = q3 + 1.5 * interQuantileRange;
                mean = d3.mean(d.map(g => g.LifeExpectancy));
                return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max, mean: mean});
            }, d => d.Status);

            y.domain([0, d3.max(filteredData, d => +d.LifeExpectancy)]);
            svg.select(".y-axis").transition().duration(800).call(d3.axisLeft(y));
            svg.select(".x-axis").call(d3.axisBottom(x));

            var boxWidth = 100;

            // Vertical lines
            var vertLines = svg.selectAll(".vertLines")
                .data(sumstat);
            vertLines.enter().append("line")
                .attr("class", "vertLines")
                .merge(vertLines)
                .transition().duration(800)
                .attr("x1", d => x(d[0]))
                .attr("x2", d => x(d[0]))
                .attr("y1", d => y(d[1].min))
                .attr("y2", d => y(d[1].max))
                .attr("stroke", "black");

            // Boxes
            var boxes = svg.selectAll(".boxes")
                .data(sumstat);
            boxes.enter().append("rect")
                .attr("class", "boxes")
                .merge(boxes)
                .transition().duration(800)
                .attr("x", d => x(d[0]) - boxWidth / 2)
                .attr("y", d => y(d[1].q3))
                .attr("height", d => y(d[1].q1) - y(d[1].q3))
                .attr("width", boxWidth)
                .attr("stroke", "black")
                .style("fill", d => colorMap[d[0]]);

            // Median lines
            var medianLines = svg.selectAll(".medianLines")
                .data(sumstat);
            medianLines.enter().append("line")
                .attr("class", "medianLines")
                .merge(medianLines)
                .transition().duration(800)
                .attr("x1", d => x(d[0]) - boxWidth / 2)
                .attr("x2", d => x(d[0]) + boxWidth / 2)
                .attr("y1", d => y(d[1].median))
                .attr("y2", d => y(d[1].median))
                .attr("stroke", "black");

            // Tooltip
            svg.selectAll(".boxes")
                .on("mouseover", function(event, d) {
                    tooltip.style("display", "block")
                        .html("<b>" + d[0] + "</b>" + "<br/>Mean: " + d[1].mean.toFixed(3) + "<br/>Median: " + d[1].median.toFixed(2) + "<br/>Q1: " + d[1].q1.toFixed(2) + "<br/>Q3: " + d[1].q3.toFixed(3))
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

            vertLines.exit().remove();
            boxes.exit().remove();
            medianLines.exit().remove();
        });
    }

    updateBoxPlot(document.getElementById('yearRange').value);

    document.getElementById('yearRange').addEventListener('input', function() {
        updateBoxPlot(this.value);
    });
})();
