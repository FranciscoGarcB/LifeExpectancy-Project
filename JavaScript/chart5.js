(function() {
    var tooltip = d3.select("#tooltip");
    var margin = {top: 45, right: 90, bottom: 70, left: 70},
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    function getWidth() {
        return document.getElementById('chart5').getBoundingClientRect().width;
    }

    var svgWidth = getWidth();
    var width = svgWidth - margin.left - margin.right;

    var svg = d3.select("#chart5")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
        .domain([30, 100])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    var y = d3.scaleLinear()
        .domain([0, 0.1])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    function kernelDensityEstimator(kernel, X) {
        return function(V) {
            return X.map(function(x) {
                return [x, d3.mean(V, function(v) { return kernel(x - v); })];
            });
        };
    }

    function kernelEpanechnikov(k) {
        return function(v) {
            return Math.abs(v /= k) <= 1 ? .75 * (1 - v * v) / k : 0;
        };
    }

     // Create color legend
     var colorLegendData = [
        {label: "Developed", color: "#3081D0"},
        {label: "Developing", color: "#7E1717"}
    ];

    // Create color legend at the top of the chart
    var colorLegend = svg.append("g")
        .attr("class", "color-legend")
        .attr("transform", "translate(0,-30)"); // Legend position

    colorLegendData.forEach(function(d, i) {
        var legendGroup = colorLegend.append("g")
            .attr("transform", "translate(" + (i * 130) + ",0)");

        legendGroup.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", d.color)
            .attr("stroke-width", 2);

        legendGroup.append("text")
            .attr("x", 30)
            .attr("y", 5)
            .text(d.label);
    });

    // Add labels to axes
    svg.append("text")
        .attr("transform", "translate(" + (width / 2) + " ," + (height + 10 + margin.bottom / 2) + ")")
        .style("text-anchor", "middle")
        .text("Years")
        .style("font-family", "Merriweather")
        .style("font-size", "12px");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Probability of death")
        .style("font-family", "Merriweather")
        .style("font-size", "12px");

    function updateDensityPlot(selectedYear) {
        d3.csv("../datasets/LifeExpectancyUpdated.csv").then(function(data) {
            var filteredData = data.filter(function(d) {
                return d.Year == selectedYear;
            });

            var kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
            var densityDeveloped = kde(filteredData.filter(function(d){ return d.Status == "Developed" }).map(function(d){ return d["Life expectancy "]; }));
            var densityDeveloping = kde(filteredData.filter(function(d){ return d.Status == "Developing" }).map(function(d){ return d["Life expectancy "]; }));

            // Reduce the opacity of existing paths
            svg.selectAll("path.mypath").style("opacity", 0.3);

            function showTooltip(event, status) {
                tooltip.style("display", "block")
                    .html("<b>" + status + "</b><br/>Year: " + selectedYear)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            }
            
            // Add new paths for the current year
            svg.append("path")
                .attr("class", "mypath")
                .datum(densityDeveloped)
                .attr("fill", "none")
                .attr("opacity", 1)
                .attr("stroke", "#3081D0")
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d[0]); })
                    .y(function(d) { return y(d[1]); })
                );
            svg.append("path")
                .attr("class", "mypath")
                .datum(densityDeveloping)
                .attr("fill", "none")
                .attr("opacity", 1)
                .attr("stroke", "#7E1717")
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d[0]); })
                    .y(function(d) { return y(d[1]); })
                );
        });
    }

    updateDensityPlot(2000);

    document.querySelector('#playButton').addEventListener('click', function() {
        let currentYear = 2000;
        const interval = setInterval(function() {
            updateDensityPlot(currentYear);
            currentYear++;
            if (currentYear > 2015) {
                clearInterval(interval);
            }
        }, 1000);
        this.disabled = true;
    });    
})();
