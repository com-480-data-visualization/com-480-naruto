const margin_c = { top: 80, right: 0, bottom: 10, left: 80 },
      width_c = 1000,
      height_c = 1000;

const x_c = d3.scaleBand().range([0, width_c]).padding(0.05);
const z = d3.scaleLinear().domain([0, 4]).clamp(true);
const color_c = d3.scaleLinear()
  .domain([0, 7, 15])
  .range(["green", "yellow", "red"]);

const svg_cooccurence = d3.select("#cooccurrence-matrix")
  .attr("width", width_c + margin_c.left + margin_c.right)
  .attr("height", height_c + margin_c.top + margin_c.bottom)
  .style("margin-left", -margin_c.left + "px")
  .append("g")
  .attr("transform", `translate(${margin_c.left},${margin_c.top})`);

d3.json("./src/cooccurrence/naruto.json").then(function (miserables) {
  const matrix = [],
        nodes = miserables.nodes,
        n = nodes.length;

  nodes.forEach((node, i) => {
    node.index = i;
    node.count = 0;
    matrix[i] = d3.range(n).map(j => ({ x: j, y: i, z: 0 }));
  });

  miserables.links.forEach(link => {
    matrix[link.source][link.target].z += link.value;
    matrix[link.target][link.source].z += link.value;
    matrix[link.source][link.source].z += link.value;
    matrix[link.target][link.target].z += link.value;
    nodes[link.source].count += link.value;
    nodes[link.target].count += link.value;
  });

  const orders = {
    count: d3.range(n).sort((a, b) => nodes[b].count - nodes[a].count),
  };

  x_c.domain(orders.count);

  svg_cooccurence.append("rect")
    .attr("class", "background")
    .attr("width", width_c)
    .attr("height", height_c);

  const row = svg_cooccurence.selectAll(".row")
    .data(matrix)
    .join("g")
    .attr("class", "row")
    .attr("transform", (d, i) => `translate(0, ${x_c(i)})`)
    .each(function(rowData, i) {
      const rowGroup = d3.select(this);

      rowGroup.selectAll(".cell")
        .data(rowData.filter(d => d.z))
        .join("rect")
        .attr("class", "cell")
        .attr("x", d => x_c(d.x))
        .attr("width", x_c.bandwidth())
        .attr("height", x_c.bandwidth())
        .style("fill-opacity", d => z(d.z))
        .style("fill", d => color_c(d.z))
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
    });

  row.append("line")
    .attr("x2", width_c);

  row.append("text")
    .attr("x", -6)
    .attr("y", x_c.bandwidth() / 2)
    .attr("dy", ".32em")
    .attr("text-anchor", "end")
    .text((d, i) => nodes[i].name);

  const column = svg_cooccurence.selectAll(".column")
    .data(matrix)
    .join("g")
    .attr("class", "column")
    .attr("transform", (d, i) => `translate(${x_c(i)}) rotate(-90)`);

  column.append("line")
    .attr("x1", -width_c);

  column.append("text")
    .attr("x", 6)
    .attr("y", x_c.bandwidth() / 2)
    .attr("dy", ".32em")
    .attr("text-anchor", "start")
    .text((d, i) => nodes[i].name);

  function mouseover(p) {
    d3.selectAll(".row text").classed("active", (_, i) => i === p.y);
    d3.selectAll(".column text").classed("active", (_, i) => i === p.x);
  }

  function mouseout() {
    d3.selectAll("text").classed("active", false);
  }
});
