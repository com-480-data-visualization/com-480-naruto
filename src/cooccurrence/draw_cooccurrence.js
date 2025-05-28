window.matrixReady = false;

const margin_c = { top: 80, right: 0, bottom: 10, left: 80 },
      width_c = 700,
      height_c = 700;

const matrixtooltip = d3.select("body").append("div")
  .attr("class", "matrix-tooltip")
  .style("opacity", 0);

let isHoveringTooltip = false;

matrixtooltip
  .on("mouseenter", () => isHoveringTooltip = true)
  .on("mouseleave", () => {
    isHoveringTooltip = false;
    matrixtooltip.transition()
      .duration(300)
      .style("opacity", 0);
  });

const x_c = d3.scaleBand().range([0, width_c]).padding(0.05);
const z = d3.scaleLinear().domain([0, 4]).clamp(true);
const color_c = d3.scaleLinear()
  .domain([1, 4, 9, 15])
  .range(["#a8ddb5", "#43a2ca", "#0868ac", "#084081"])
  .clamp(true);

const svg_cooccurence = d3.select("#cooccurrence-matrix")
  .attr("width", width_c + margin_c.left + margin_c.right)
  .attr("height", height_c + margin_c.top + margin_c.bottom)
  .style("margin-left", -margin_c.left + "px")
  .append("g")
  .attr("transform", `translate(${margin_c.left},${margin_c.top})`);



d3.json("./src/cooccurrence/naruto.json").then(function (narutoData) {
  const matrix = [],
        nodes = narutoData.nodes,
        n = nodes.length;

  nodes.forEach((node, i) => {
    node.index = i;
    node.count = 0;
    matrix[i] = d3.range(n).map(j => ({ x: j, y: i, z: 0 }));
  });

  narutoData.links.forEach(link => {
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
        .data(rowData.filter(d => d.x !== d.y)) // Filter out diagonal cells
        .join("rect")
        .attr("class", "cell")
        .attr("x", d => x_c(d.x))
        .attr("width", x_c.bandwidth())
        .attr("height", x_c.bandwidth())
        .style("fill", d => (d.z === 0 ? "#e0f3db" : color_c(d.z)))
        .on("mouseover", function(event, d) {
          mouseover(d);
          isHoveringTooltip = true;

          const sourceName = nodes[d.y].name;
          const targetName = nodes[d.x].name;

          // Set tooltip content first
          matrixtooltip
            .html(`Click to see battles between ${sourceName} and ${targetName}`);

          // Get SVG and tooltip bounding boxes
          const svgRect = svg_cooccurence.node().getBoundingClientRect();
          const tooltipNode = matrixtooltip.node();
          const tooltipRect = tooltipNode.getBoundingClientRect();

          // Cell center in page coordinates
          const cellX = svgRect.left + x_c(d.x) + x_c.bandwidth() / 2 + margin_c.left;
          const cellY = svgRect.top + x_c(d.y) + x_c.bandwidth() / 2 + margin_c.top + window.scrollY;

          // Default: place tooltip right and below the cell
          let left = cellX + 10;
          let top = cellY + 10;

          // Adjust if tooltip would overflow right edge
          if (left + tooltipRect.width > svgRect.right) {
            left = cellX - tooltipRect.width - 10;
            if (left < svgRect.left) left = svgRect.left + 5;
          }
          // Adjust if tooltip would overflow bottom edge
          if (top + tooltipRect.height > svgRect.bottom + window.scrollY) {
            top = cellY - tooltipRect.height - 10;
            if (top < svgRect.top + window.scrollY) top = svgRect.top + window.scrollY + 5;
          }
          // Adjust if tooltip would overflow left edge
          if (left < svgRect.left) left = svgRect.left + 5;
          // Adjust if tooltip would overflow top edge
          if (top < svgRect.top + window.scrollY) top = svgRect.top + window.scrollY + 5;

          matrixtooltip
            .style("opacity", 0.9)
            .style("left", `${left}px`)
            .style("top", `${top}px`);
        })
        .on("mouseout", function () {
          mouseout();
          isHoveringTooltip = false;
        
          // Delay hiding only if not clicked
          setTimeout(() => {
            if (!isHoveringTooltip) {
              matrixtooltip.style("opacity", 0);
            }
          }, 150); // short delay to avoid flicker
        })
        .on("click", function(event, d) {
          // Find all battles between these two characters
          const battles = narutoData.links.filter(link => 
            (link.source === d.y && link.target === d.x) || 
            (link.source === d.x && link.target === d.y)
          ).flatMap(link => link.battles || []);

          battles.sort((a, b) => a.episode - b.episode); // Sort by episode number
          const battleCount = battles.length;

          // Set the tooltip content first (so we can measure its size)
          if (battleCount > 0) {
            const battleList = battles.map(battle => 
              `<div style="margin-bottom: 5px;">
                <strong>Episode: ${battle.episode}</strong><br>
                <strong>Description:</strong> ${battle.description}<br>
                <strong>Outcome:</strong> ${battle.outcome}
              </div>`
            ).join('');
            matrixtooltip.html(`
              <div style="max-height: 300px; overflow-y: auto;">
                <h4 style="margin-top: 0;">${battleCount} Battle${battleCount !== 1 ? 's' : ''} between ${nodes[d.y].name} and ${nodes[d.x].name}</h4>
                ${battleList}
              </div>
            `);
          } else {
            matrixtooltip.html(`No recorded battles between ${nodes[d.y].name} and ${nodes[d.x].name}`);
          }

          // Now measure the tooltip
          const svgRect = svg_cooccurence.node().getBoundingClientRect();
          const tooltipNode = matrixtooltip.node();
          const tooltipRect = tooltipNode.getBoundingClientRect();

          // Cell center in page coordinates
          const cellX = svgRect.left + x_c(d.x) + x_c.bandwidth() / 2 + margin_c.left;
          const cellY = svgRect.top + x_c(d.y) + x_c.bandwidth() / 2 + margin_c.top + window.scrollY;

          // Default: place tooltip right and below the cell
          let left = cellX;
          let top = cellY;

          // Adjust if tooltip would overflow right edge
          if (left + tooltipRect.width > svgRect.right) {
            left = cellX - tooltipRect.width;
            if (left < svgRect.left) left = svgRect.left;
          }
          // Adjust if tooltip would overflow bottom edge
          if (top + tooltipRect.height > svgRect.bottom + window.scrollY) {
            top = cellY - tooltipRect.height;
            if (top < svgRect.top + window.scrollY) top = svgRect.top + window.scrollY;
          }
          // Adjust if tooltip would overflow left edge
          if (left < svgRect.left) left = svgRect.left;
          // Adjust if tooltip would overflow top edge
          if (top < svgRect.top + window.scrollY) top = svgRect.top + window.scrollY;

          matrixtooltip
            .transition().style("opacity", .9);
          matrixtooltip
            .style("left", `${left}px`)
            .style("top", `${top}px`);
        });
    });

  row.append("line")
    .attr("x2", width_c);

  row.append("text")
    .attr("x", -6)
    .attr("y", x_c.bandwidth() / 2)
    .attr("dy", ".32em")
    .attr("text-anchor", "end")
    .text((d, i) => nodes[i].name)
    .each(function(d, i) {
      const maxWidth = 75;
      let fontSize = 12;
      const text = d3.select(this);
      text.attr("font-size", fontSize + "px");
  
      while (this.getComputedTextLength() >= maxWidth && fontSize > 6) {
        fontSize -= 1;
        text.attr("font-size", fontSize + "px");
      }
    });

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
    .attr("font-size", "10px")
    .text((d, i) => nodes[i].name)
    .each(function(d, i) {
      const maxWidth = 75;
      let fontSize = 12;
      const text = d3.select(this);
      text.attr("font-size", fontSize + "px");
  
      while (this.getComputedTextLength() >= maxWidth && fontSize > 6) {
        fontSize -= 1;
        text.attr("font-size", fontSize + "px");
      }
    });

  function mouseover(p) {
    d3.selectAll(".row text").classed("active", (_, i) => i === p.y);
    d3.selectAll(".column text").classed("active", (_, i) => i === p.x);
  }

  function mouseout() {
    d3.selectAll("text").classed("active", false);
  }

  function matrixHighlightTracked(trackedCharacterNames) {
    const n = nodes.length;

    // Separate tracked and untracked nodes
    const tracked = nodes.filter(node => trackedCharacterNames.has(node.name));
    const untracked = nodes.filter(node => !trackedCharacterNames.has(node.name));

    // Sort each group by descending battle count
    tracked.sort((a, b) => b.count - a.count);
    untracked.sort((a, b) => b.count - a.count);

    // Create a new order array
    const newOrder = tracked.concat(untracked).map(node => node.index);
    x_c.domain(newOrder);

    // Transition rows
    const t = svg_cooccurence.transition().duration(1000);
    t.selectAll(".row")
      // .transition()
      // .duration(500)
      .attr("transform", (_, i) => `translate(0, ${x_c(i)})`)
      .selectAll(".cell")
      .transition()
      .duration(500)
      .attr("x", d => x_c(d.x));

    // Transition columns
    t.selectAll(".column")
      .transition()
      .duration(500)
      .attr("transform", (_, i) => `translate(${x_c(i)}) rotate(-90)`);

    // Highlight cells
    svg_cooccurence.selectAll(".row").each(function(rowData, rowIndex) {
      d3.select(this)
        .selectAll(".cell")
        .attr("class", function(d) {
          const isTracked = trackedCharacterNames.has(nodes[d.y].name) ||
                            trackedCharacterNames.has(nodes[d.x].name);
          return `cell${isTracked ? " tracked-cell" : ""}`;
        });
    });

    // Highlight row labels
    svg_cooccurence.selectAll(".row text")
      .attr("class", (_, i) =>
        trackedCharacterNames.has(nodes[i].name) ? "tracked-label" : null
      );

    // Highlight column labels
    svg_cooccurence.selectAll(".column text")
      .attr("class", (_, i) =>
        trackedCharacterNames.has(nodes[i].name) ? "tracked-label" : null
      );
  }

  window.matrixHighlightTracked = matrixHighlightTracked;
  window.matrixReady = true;
});