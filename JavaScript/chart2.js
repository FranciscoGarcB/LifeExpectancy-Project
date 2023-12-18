(function() {
var tooltip = d3.select("#tooltip");

var svg;
var x, y;
var currentFilter = getTop10; // Initialize with Top 10

// Define margins in a global scope
var margin = {top: 20, right: 70, bottom: 20, left: 50};

function getWidth() {
    var containerWidth = document.getElementById('chart2').getBoundingClientRect().width;
    return containerWidth - margin.left - margin.right;
}

function initializeChart() {
    var width = getWidth();
    var height = 2100 - margin.top - margin.bottom; // Initial height for Top 10 and Bottom 10

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
    d3.csv('../datasets/LifeExpectancyShort.csv').then(function(data) {
        var width = getWidth();

        var filteredData = currentFilter(data.filter(d => d.Year == selectedYear));

        // Adjust container height and style
        var height = (currentFilter === getAllData) ? 2100 : 400;
        height -= margin.top + margin.bottom;

        // Adjust SVG size and Y scale
        svg.attr("height", height + margin.top + margin.bottom);
        y.range([0, height]);
        svg.select(".x-axis").attr("transform", "translate(0," + height + ")");

        // Update scales
        x.range([0, width]);
        x.domain([0, d3.max(filteredData, d => +d['Life expectancy '])]);
        y.domain(filteredData.map(d => d.Country));

        // Update axes
        svg.select(".x-axis").call(d3.axisBottom(x));
        svg.select(".y-axis").call(d3.axisLeft(y));

        // Hide Y-axis labels
        svg.selectAll(".y-axis text").style("opacity", 0);

        // Select and update bars
        var bars = svg.selectAll("rect")
            .data(filteredData, d => d.Country);

        // Define color based on the 'Status'
        var colorMap = { "Developed": "#3081D0", "Developing": "#7E1717" };

        // Transition for existing bars
        bars.transition()
            .duration(800)
            .attr("y", d => y(d.Country))
            .attr("width", d => x(d['Life expectancy ']))
            .attr("height", y.bandwidth());

        // Add new bars
        bars.enter().append("rect")
            .attr("x", x(0))
            .attr("y", d => y(d.Country))
            .attr("height", y.bandwidth())
            .attr("fill", d => colorMap[d.Status])
            .transition()
            .duration(800)
            .attr("width", d => x(d['Life expectancy ']));

        // Select and update text for each bar
        var barText = svg.selectAll(".bar-text")
        .data(filteredData, d => d.Country);

        // Transition for existing text
        barText.transition()
            .duration(800)
            .attr("y", d => y(d.Country) + y.bandwidth() / 2)
            .attr("x", 5)
            .text(d => `${d.Country}`);

        // Add new text for new bars
        barText.enter().append("text")
            .attr("class", "bar-text")
            .attr("y", d => y(d.Country) + y.bandwidth() / 2)
            .attr("x", 5)
            .attr("dy", ".35em")
            .text(d => `${d.Country}`)
            .attr("fill", "white")
            .style("font-size", "9px");

        // Remove text that is no longer needed
        barText.exit().remove();

        // Remove bars that are no longer needed
        bars.exit().remove();

        // Mouse events
        svg.selectAll("rect")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block");
                tooltip.html("<b>" + d.Country + "</b>" + 
                    "<br/>Life Expectancy: " + d['Life expectancy '] +
                    "<br/>Adult Mortality: " + d['Adult Mortality'] +
                    "<br/>Infant deaths: " + d['infant deaths'])
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
                d3.select(this).attr("fill", d => colorMap[d.Status]);;
            });
    });

    // Apply scrollable style if the filter is "Show All"
    var chartContainer = document.getElementById('chart2');
    if (currentFilter === getAllData) {
        chartContainer.classList.add('scrollable');
    } else {
        chartContainer.classList.remove('scrollable');
        chartContainer.style.maxHeight = null; // Reset maximum height
    }
}

// Filtering Functions
function getTop10(data) {
    return data.sort((a, b) => b['Life expectancy '] - a['Life expectancy ']).slice(0, 10);
}

function getBottom10(data) {
    return data.sort((a, b) => a['Life expectancy '] - b['Life expectancy ']).slice(0, 10);
}

function getAllData(data) {
    return data;
}

// Event handlers for radio buttons
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

// Initialize the chart with Top 10
initializeChart();
updateBarChart(document.getElementById('yearRange').value);

// Listen for changes in the year slider
document.getElementById('yearRange').addEventListener('input', function() {
    updateBarChart(this.value);
});

// Update the chart when the window size changes
window.addEventListener('resize', function() {
    updateBarChart(document.getElementById('yearRange').value);
});
})();