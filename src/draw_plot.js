const dimensions = [
  "Ninjutsu", "Taijutsu", "Genjutsu", "Intelligence", "Strength",
  "Speed", "Chakra", "Hand Seals", "Total Average"
];

const usedHues = new Set();
const colorMap = new Map();

const y = {};
const encyclopediaValues = ["Rin no Sho", "Tō no Sho", "Shō no Sho"];
const encyclopediaColor = d3.scaleOrdinal().domain(encyclopediaValues).range(d3.schemeSet2);
const selectedNames = new Set();
const preselectedPairs = new Set(["Anko Mitarashi__Rin no Sho", "Baki__Rin no Sho"]);

const svg = d3.select("#char-plot"),
  margin = { top: 30, right: 10, bottom: 10, left: 10 },
  width = +svg.attr("width") - margin.left - margin.right,
  height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
const x = d3.scalePoint().range([0, width]).padding(1).domain(dimensions);

g.append("g").attr("class", "foreground-layer");

d3.csv("table_data_en.csv").then(data => {
  data.forEach(d => {
    dimensions.forEach(dim => {
      if (dim === "Total Average") {
        d["Total Average"] = +d["Total"] / 9;
      } else {
        d[dim] = +d[dim];
      }
    });
  });

  dimensions.forEach(dim => {
    const max = dim === "Total Average" ? 5 : d3.max(data, d => d[dim]);
    y[dim] = d3.scaleLinear().domain([0, Math.ceil(max)]).range([height, 0]);
  });

  drawAxes();
  setupUI(data);
  updateChart(data);
});

function drawAxes() {
  const axis = d3.axisLeft().ticks(5).tickFormat(d3.format(".1f"));

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
  dimensionGroup.selectAll(".tick text")
  .style("font-size", "14px");  // or larger if needed

dimensionGroup.selectAll(".axis-label")
  .style("font-size", "15px")
  .style("font-weight", "bold");
  
  dimensionGroup
  .filter(d => d === "Total Average")
  .select("text.axis-label")
  .attr("x", -10); // adjust this value as needed
}
function setupUI(data) {
  const checkboxContainer = d3.select("#checkbox-container");
  const searchBox = d3.select("#search-box");
  const characterNames = [...new Set(data.map(d => d.Name))].sort(d3.ascending);

  const encyclopediaContainer = d3.select("#encyclopedia-container");
  encyclopediaValues.forEach(enc => {
    selectedNames.add(enc);
    createPillCheckbox(encyclopediaContainer, enc, () => updateChart(data));
  });

  // Add preselected pairs to selectedNames
  data.forEach(d => {
    const key = `${d.Name}__${d.Encyclopedia}`;
    if (preselectedPairs.has(key)) {
      selectedNames.add(d.Name);
    }
  });

  function updateCharacterCheckboxes(filter = "") {
    const filtered = characterNames.filter(name =>
      name.toLowerCase().includes(filter.toLowerCase())
    );

    checkboxContainer.selectAll(".pill-checkbox").remove();

    filtered.forEach(name => {
      createPillCheckbox(checkboxContainer, name, () => updateChart(data));
    });
  }

  searchBox.on("input", function () {
    updateCharacterCheckboxes(this.value);
  });

  d3.select("#select-all-btn").on("click", () => {
    characterNames.forEach(name => selectedNames.add(name));
    updateCharacterCheckboxes(searchBox.property("value"));
    updateChart(data);
  });

  d3.select("#deselect-all-btn").on("click", () => {
    selectedNames.clear();
    updateCharacterCheckboxes(searchBox.property("value"));
    updateChart(data);
  });

  // Initialize checkboxes and chart
  updateCharacterCheckboxes();
  updateChart(data); // Ensure preselected pairs are shown
}

function updateChart(data) {
  
  const selectedEncyclopedias = new Set();
  d3.selectAll("#encyclopedia-container input:checked").each(function () {
    selectedEncyclopedias.add(this.value);
  });

  const seen = new Set();
  const filtered = data.filter(d => {
    const key = `${d.Name}__${d.Encyclopedia}`;
    return selectedNames.has(d.Name) &&
           selectedEncyclopedias.has(d.Encyclopedia) &&
           !seen.has(key) && seen.add(key);
  });

  const lines = g.select(".foreground-layer")
    .selectAll(".foreground-line")
    .data(filtered, d => `${d.Name}__${d.Encyclopedia}`);

  lines.enter()
    .append("path")
    .attr("class", "line foreground-line")
    .attr("stroke", d => hashColor(`${d.Name}__${d.Encyclopedia}`))
    .merge(lines)
    .transition().duration(500)
    .attr("d", d => path(d))
    .selection()
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition().duration(100)
        .style("stroke-width", 3)
        .style("stroke-opacity", 1);

      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`<strong>${d.Name}</strong><br>${d.Encyclopedia}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY}px`);
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition().duration(300)
        .style("stroke-width", 1.5)
        .style("stroke-opacity", 0.7);

      d3.select("#tooltip").style("opacity", 0);
    }).on("mouseover", function (event, d) {
      // Dim all lines
      d3.selectAll(".foreground-line")
        .transition().duration(200)
        .style("stroke-opacity", 0.1);
    
      // Highlight the hovered line
      d3.select(this)
        .raise()
        .transition().duration(200)
        .style("stroke-width", 3)
        .style("stroke-opacity", 1);
    
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`<strong>${d.Name}</strong><br>${d.Encyclopedia}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY}px`);
    })
    .on("mouseout", function () {
      d3.selectAll(".foreground-line")
        .transition().duration(300)
        .style("stroke-opacity", 0.7)
        .style("stroke-width", 1.5);
    
      d3.select("#tooltip").style("opacity", 0);
    });;

  lines.exit().remove();
}

function path(d) {
  return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
}

function hashColor(str) {
  if (colorMap.has(str)) return colorMap.get(str);

  let hue = 0;
  const step = 37; // Use a prime number to space hues well around the circle

  while (usedHues.has(hue)) {
    hue = (hue + step) % 360;
  }

  usedHues.add(hue);
  const color = `hsl(${hue}, 60%, 50%)`;
  colorMap.set(str, color);
  return color;
}

function createPillCheckbox(container, value, onChange) {
  const wrapper = container.append("div").attr("class", "pill-checkbox");

  wrapper.append("input")
    .attr("type", "checkbox")
    .attr("id", value)
    .attr("value", value)
    .property("checked", selectedNames.has(value))
    .on("change", function () {
      if (this.checked) {
        selectedNames.add(this.value);
      } else {
        selectedNames.delete(this.value);
      }
      onChange();
    });

  wrapper.append("label")
    .attr("for", value)
    .text(value);
}
