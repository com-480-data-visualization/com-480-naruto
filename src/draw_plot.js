const svg = d3.select("#char-plot"),
margin = { top: 30, right: 10, bottom: 10, left: 10 },
width = +svg.attr("width") - margin.left - margin.right,
height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g")
.attr("transform", `translate(${margin.left},${margin.top})`);

let dataDBG;

const dimensions = [
"Ninjutsu", "Taijutsu", "Genjutsu", "Intelligence", "Strength", "Speed", "Chakra", "Hand Seals", "Total"
];

const x = d3.scalePoint()
.range([0, width])
.padding(1)
.domain(dimensions);

const y = {};
const color = d3.scaleOrdinal(d3.schemeCategory10); // For Generation or category

d3.csv("table_data_en.csv").then(data => {
dataDBG = data; // Store the data for later use
// Parse and build y scales
dimensions.forEach(d => {
  data.forEach(p => p[d] = +p[d]); // convert to number
  y[d] = d3.scaleLinear()
    .domain(d3.extent(data, p => p[d]))
    .range([height, 0]);
});
// Draw background lines, invisible just for action


// Draw foreground lines
g.append("g")
  .attr("class", "foreground-layer")
  .selectAll("path")
  .data(data)
  .join("path")
  .attr("class", "line foreground-line")
  .attr("d", path)
  .attr("stroke", d => color(d.Name));

g.append("g")
  .attr("class", "background-layer")
  .selectAll("path")
  .data(data)
  .join("path")
  .attr("class", "line background-line")
  .attr("d", path)
  .attr("stroke", d => color(d.Name))
  .style("stroke-opacity", "0.0")
  .style("stroke-width", "3px")
  .on("mouseover", function (event, d) {
    d3.selectAll(".foreground-line")
      .transition().duration(1000)
      .style("stroke-opacity", 0.1)
      .style("stroke-width", 1);

    d3.select(this)
      .transition().duration(50)
      .style("stroke-opacity", 1);

    //dislpay photo
    const firstDim = dimensions[0];
    const yPos = y[firstDim](d[firstDim]);

    const photoPath = `./photos/${d.name}.jpg`;

  })
  .on("mouseout", function () {
    d3.selectAll(".foreground-line")
      .transition().duration(200)
      .style("stroke-opacity", 1.0)
      .style("stroke-width", 1.5);
    d3.select(this)
      .transition().duration(500)
      .style("stroke-opacity", 0);
  });


// Draw axes
const axis = d3.axisLeft();
const dimensionGroup = g.selectAll(".dimension")
  .data(dimensions)
  .join("g")
  .attr("class", "dimension axis-group")
  .attr("transform", d => `translate(${x(d)})`);

dimensionGroup.each(function (d) {
  d3.select(this).call(axis.scale(y[d]));
});

// Axis labels
dimensionGroup.append("text")
  .attr("class", "axis-label")
  .attr("y", -9)
  .text(d => d);

function path(d) {
  return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
}
});
