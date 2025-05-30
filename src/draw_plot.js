window.charStatsReady = false;

const dimensions = [
  "Ninjutsu", "Taijutsu", "Genjutsu", "Intelligence", "Strength",
  "Speed", "Chakra", "Hand Seals", "Total Average"
];

const usedHues = new Set();
const colorMap = new Map();

const y = {};
const encyclopediaValues = ["Rin no Sho", "Tō no Sho", "Shō no Sho"];
const encyclopediaColor = d3.scaleOrdinal().domain(encyclopediaValues).range(d3.schemeSet2);

let plotData = []; // Store the data for reuse

// Setup the SVG and scales
const svg = d3.select("#char-plot"),
  margin = { top: 30, right: 30, bottom: 10, left: 30 },
  width = parseInt(svg.style("width")) - margin.left - margin.right,
  height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
const x = d3.scalePoint().range([0, width]).padding(1).domain(dimensions);

g.append("g").attr("class", "foreground-layer");

// // tooltip position
// function positionTooltip(event, tooltip) {
//   const tooltipNode = tooltip.node();
//   const tooltipWidth = tooltipNode.offsetWidth;
//   const tooltipHeight = tooltipNode.offsetHeight;
//   const xOffset = -20; // Shift slightly left
//   const yOffset = 40;  // Shift slightly downward

//   let left = event.pageX + xOffset;
//   let top = event.pageY + yOffset;

//   // Prevent overflow on the right
//   if (left + tooltipWidth > window.innerWidth) {
//     left = window.innerWidth - tooltipWidth - 10;
//   }

//   // Prevent overflow at the bottom
//   if (top + tooltipHeight > window.innerHeight) {
//     top = window.innerHeight - tooltipHeight - 10;
//   }

//   tooltip.style("left", `${left}px`).style("top", `${top}px`);
// }


function positionTooltip(event, tooltip) {
  // Get the container's bounding rectangle
  const container = document.getElementById('char-plot-container');
  const containerRect = container.getBoundingClientRect();

  // Use event.clientX/Y (relative to viewport), subtract container's top/left
  const tooltipNode = tooltip.node();
  const tooltipWidth = tooltipNode.offsetWidth;
  const tooltipHeight = tooltipNode.offsetHeight;
  const xOffset = -20;
  const yOffset = 40;

  let left = event.clientX - containerRect.left + xOffset;
  let top = event.clientY - containerRect.top + yOffset;

  // Prevent overflow on the right
  if (left + tooltipWidth > containerRect.width) {
    left = containerRect.width - tooltipWidth - 10;
  }
  // Prevent overflow at the bottom
  if (top + tooltipHeight > containerRect.height) {
    top = containerRect.height - tooltipHeight - 10;
  }

  tooltip
    .style("left", `${left}px`)
    .style("top", `${top}px`);
}
function safelyRedrawChartOnResize() {

  // Hide tooltip if visible
  d3.select("#tooltip").style("opacity", 0).style("display", "none");
  // Remove all foreground lines to clear event listeners
  g.select(".foreground-layer").selectAll(".foreground-line").remove();

  const newWidth = parseInt(svg.style("width")) - margin.left - margin.right;
  x.range([0, newWidth]);
  drawAxes();
  if (typeof window.updateCharPlot === 'function') {
    window.updateCharPlot();
  }
}

window.addEventListener("resize", safelyRedrawChartOnResize);

// Main function to load data and initialize the plot
plotData = charStatsP.then(data => {
  plotData = data;
  
  // Process the data
  data.forEach(d => {
    dimensions.forEach(dim => {
      if (dim === "Total Average") {
        d["Total Average"] = +d["Total"] / 9;
      } else {
        d[dim] = +d[dim];
      }
    });
  });

  // Set up the y scales for each dimension
  dimensions.forEach(dim => {
    const max = dim === "Total Average" ? 5 : d3.max(data, d => d[dim]);
    y[dim] = d3.scaleLinear().domain([0, Math.ceil(max)]).range([height, 0]);
  });
  
  // Draw the axes and update the chart
  drawAxes();
  window.charStatsReady = true;
  // updateChart();
});

// Draw axes for the parallel coordinates plot
function drawAxes() {
  const axis = d3.axisLeft().ticks(5).tickFormat(d3.format(".1f"));

  // Remove any existing axes
  g.selectAll(".dimension").remove();

  const dimensionGroup = g.selectAll(".dimension")
    .data(dimensions)
    .join("g")
    .attr("class", "dimension axis-group")
    .attr("transform", d => `translate(${x(d)})`);

  dimensionGroup.append("text")
    .attr("class", "axis-label")
    .attr("y", -9)
    .text(d => d);

  dimensionGroup.each(function (d) {
    const axisGroup = d3.select(this);
    axisGroup.call(axis.scale(y[d]));

    axisGroup.selectAll(".tick")
      .append("circle")
      .attr("r", 3)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("fill", "#666")
      .attr("opacity", 0.8);
  });

// --- ROTATE LABELS IF NEEDED ---
const axisPositions = dimensions.map(dim => x(dim));
let minDist = Infinity;
for (let i = 1; i < axisPositions.length; i++) {
  minDist = Math.min(minDist, axisPositions[i] - axisPositions[i - 1]);
}
const rotate = minDist < 100;

dimensionGroup.selectAll(".axis-label")
  .attr("text-anchor", rotate ? "end" : "middle")
  .attr("transform", function() {
    return rotate ? "rotate(-90)" : null;
  })
  .attr("x", function() {
    return rotate ? -10 : 0;
  })
  .attr("y", function() {
    return rotate ? -5 : -9;
  })
  .style("font-size", rotate ? "12px" : "15px")
  .style("font-weight", "bold");

// Remove the last tick label if rotated
if (rotate) {
  dimensionGroup.each(function() {
    const ticks = d3.select(this).selectAll(".tick text");
    if (!ticks.empty()) {
      ticks.filter((d, i, nodes) => i === nodes.length - 1)
        .style("display", "none");
    }
  });
}
}

// Update the chart based on tracking and encyclopedia filters
function updateChart(data = null, trackedNames = null, selectedEncyclopedias = null) {
  // Use provided data or fall back to stored data
  const currentData = data || plotData;
  if (!currentData || currentData.length === 0) return;
  
  const useTrackedNames = trackedNames || 
    (window.trackedCharacters ? 
      new Set(Array.from(window.trackedCharacters).map(id => {
        const char = characters.find(c => c.id === id);
        return char ? char.name : null;
      }).filter(Boolean)) : 
      new Set());

  // If selectedEncyclopedias is not provided, use what's in the sidebar
  const useSelectedEncyclopedias = selectedEncyclopedias || 
    (window.selectedEncyclopedias || new Set(encyclopediaValues));
  
  // Filter the data based on selected characters and encyclopedias
  const seen = new Set();
  const filtered = currentData.filter(d => {
    const key = `${d.Name}__${d.Encyclopedia}`;
    return useTrackedNames.has(d.Name) &&
           useSelectedEncyclopedias.has(d.Encyclopedia) &&
           !seen.has(key) && seen.add(key);
  });

  const strokeWidth = 5;
  // Update the lines on the plot
  const lines = g.select(".foreground-layer")
    .selectAll(".foreground-line")
    .data(filtered, d => `${d.Name}__${d.Encyclopedia}`);

  function encyclopediaOpacity(source) {
    switch (source) {
      case "Rin no Sho": return 0.6;  // least prominent (first book)
      case "Tō no Sho":  return 0.8;
      case "Shō no Sho": return 1;  // most prominent
      default: return 0.5;
    }
  } 

  // Add new lines
  lines.enter()
  .append("path")
  .attr("class", "line foreground-line")
  .attr("stroke", d => hashColor(d.Name))
  .attr("d", d => path(d))
  .attr("data-base-opacity", d => encyclopediaOpacity(d.Encyclopedia))
  .style("stroke-width", strokeWidth)
  .style("stroke-opacity", d => encyclopediaOpacity(d.Encyclopedia))
  .on("mouseover", function (event, d) {
    // Dim all lines using their base opacity * 0.1
    d3.selectAll(".foreground-line")
      .transition().duration(200)
      .style("stroke-opacity", 0.1);

    // Highlight the hovered line
    d3.select(this)
      .raise()
      .transition().duration(200)
      .style("stroke-opacity", 1);

    const tooltip = d3.select("#tooltip")
      .style("display", "block")
      .style("opacity", 1)
      .html(`<strong>${d.Name}</strong><br>${d.Encyclopedia}`);

    positionTooltip(event, tooltip);
  })
  .on("mouseout", function () {
    // Restore each line's original base opacity
    d3.selectAll(".foreground-line")
      .transition().duration(300)
      .style("stroke-opacity", function () {
        return d3.select(this).attr("data-base-opacity");
      });

    d3.select("#tooltip").style("opacity", 0).style("display", "none");
  });


  // Update existing lines
  lines.transition().duration(500)
    .attr("d", d => path(d));

  // Remove lines that are no longer needed
  lines.exit().remove();
}

// Generate the path for a data point
function path(d) {
  return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
}

// Generate a consistent color based on a string
function hashColor(str) {
  if (colorMap.has(str)) return colorMap.get(str);

  // Get hash value between 0 and 1
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0; // unsigned 32-bit
  }
  const t = (hash % 1000) / 1000; // normalize to [0,1]

  const color = d3.interpolateSinebow(t); // or d3.interpolateTurbo(t)
  colorMap.set(str, color);
  return color;
}


// Make updateChart available globally
window.updateChart = updateChart;