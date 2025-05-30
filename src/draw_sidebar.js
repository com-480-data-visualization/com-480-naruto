// This script handles all the sidebar functionality including:
// 1. Rendering encyclopedia filters
// 2. Rendering character list with track buttons
// 3. Showing character details when a name is clicked
// 4. Managing tracking state for the parallel coordinates plot

// Global state
const DEFAULT_TRACKED_IDS = [1, 2, 3];
const selectedEncyclopedias = new Set(["Rin no Sho", "Tō no Sho", "Shō no Sho"]);
const trackedCharacters = new Set();
let characters = []; // Will be populated from characters.json


// On load, restore from localStorage or use defaults
function loadTrackedCharacters() {
    DEFAULT_TRACKED_IDS.forEach(id => trackedCharacters.add(id));
}


// Initialize sidebar
async function initSidebar() {
loadTrackedCharacters(); // <-- Add this line
  setupEncyclopediaFilters();
  await fetchCharacters();
  await charStatsP;
  setupCharacterSearch();
  renderCharacterList();   // <-- To reflect the tracked state in UI
  updateDependantElements();   
  updateMatrix();     // <-- To update the plot on first load

  document.getElementById("track-all-btn").onclick = () => {
    trackedCharacters.clear();
    characters.forEach(char => trackedCharacters.add(char.id));
    localStorage.setItem("trackedCharacters", JSON.stringify(Array.from(trackedCharacters)));
    renderCharacterList();
    updateDependantElements();
    updateMatrix();
  };

  document.getElementById("untrack-all-btn").onclick = () => {
    trackedCharacters.clear();
    localStorage.setItem("trackedCharacters", JSON.stringify([]));
    renderCharacterList();
    updateDependantElements();
    updateMatrix();
  };
}

// Setup encyclopedia filters
function setupEncyclopediaFilters() {
  const encyclopediaContainer = document.getElementById("encyclopedia-container");
  const encyclopediaValues = ["Rin no Sho", "Tō no Sho", "Shō no Sho"];
  
  encyclopediaValues.forEach(enc => {
    const wrapper = document.createElement("div");
    wrapper.className = "pill-checkbox";
    
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `enc-${enc}`;
    input.value = enc;
    input.checked = selectedEncyclopedias.has(enc);
    input.addEventListener("change", function() {
      if (this.checked) {
        selectedEncyclopedias.add(this.value);
      } else {
        selectedEncyclopedias.delete(this.value);
      }
      updateDependantElements();
      updateMatrix();
    });
    
    const label = document.createElement("label");
    label.htmlFor = `enc-${enc}`;
    label.textContent = enc;
    
    wrapper.appendChild(input);
    wrapper.appendChild(label);
    encyclopediaContainer.appendChild(wrapper);
  });
}

// Fetch character data
async function fetchCharacters() {
  try {
    characters = await charactersP
  } catch (error) {
    console.error("Error fetching characters:", error);
    // Show a fallback message
    document.getElementById("character-list").innerHTML = 
      "<div class='error-message'>Failed to load character data</div>";
  }
}

function createCircle(letter, active) {
  const circle = document.createElement('div');
  circle.textContent = letter;
  circle.style.width = '16px';
  circle.style.height = '16px';
  if (active) {
    circle.style.backgroundColor = '#f57c00';
  } else {
    circle.style.backgroundColor = '#c0c0c0';
  }
  circle.style.color = 'white';
  circle.style.fontWeight = 'bold';
  circle.style.fontSize = '14px';
  circle.style.textAlign = 'center';
  circle.style.lineHeight = '16px';
  circle.style.borderRadius = '50%';
  circle.style.display = 'inline-block';
  circle.style.marginLeft = '2px';
  return circle;
}

function createCharacterStatus(appears_in) {
  const status = document.createElement('div');
  status.style.marginLeft = 'auto';
  status.width = '52px';
  status.appendChild(createCircle("M", appears_in?.includes("map")));
  status.appendChild(createCircle("P", appears_in?.includes("plot")));
  status.appendChild(createCircle("C", appears_in?.includes("matrix")));
  return status;
}

// Render character list
function renderCharacterList(filter = "") {
  const listEl = document.getElementById("character-list");
  listEl.innerHTML = "";
  
  characters
    .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
    .forEach(character => {
      const item = document.createElement("div");
      item.className = "character-item";
      
      // Track button
      const trackBtn = document.createElement("button");
      trackBtn.className = `track-button ${trackedCharacters.has(character.id) ? 'active' : ''}`;
      trackBtn.textContent = trackedCharacters.has(character.id) ? "Tracking" : "Track";
      trackBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleTracking(character.id, trackBtn);
      });
      
      // Character name
      const nameSpan = document.createElement("span");
      nameSpan.className = "character-name-text";
      nameSpan.textContent = character.name;
      
      item.appendChild(trackBtn);
      item.appendChild(nameSpan);
      item.appendChild(createCharacterStatus(character.appears_in));
      
      // Click on name shows details
      item.addEventListener("click", () => showCharacterDetails(character));
      
      listEl.appendChild(item);
    });
}

// Toggle character tracking
function toggleTracking(characterId, buttonEl) {
  if (trackedCharacters.has(characterId)) {
    trackedCharacters.delete(characterId);
    buttonEl.textContent = "Track";
    buttonEl.classList.remove("active");
  } else {
    trackedCharacters.add(characterId);
    buttonEl.textContent = "Tracking";
    buttonEl.classList.add("active");
  }
  
  updateDependantElements();
  updateMatrix();
}

// Show character details
function showCharacterDetails(character) {
  const detailsEl = document.getElementById("character-details");
  
  detailsEl.innerHTML = `
    <div class="details-container">
      <img src="${character.avatar}" alt="${character.name}" class="avatar">
      <h3 class="character-name">${character.name}</h3>
      <p class="character-description">${character.description}</p>
    </div>
  `;
}

// Setup character search
function setupCharacterSearch() {
  const searchEl = document.getElementById("character-search");
  searchEl.addEventListener("input", () => {
    renderCharacterList(searchEl.value);
  });
}

const updateMatrix = () => {
  // instead of sleeping should wait smarter
  if (window.matrixReady && typeof window.redrawMatrix === 'function') {
    const trackedNames = new Set();
    characters
      .filter(char => trackedCharacters.has(char.id))
      .forEach(char => trackedNames.add(char.name));

    window.redrawMatrix(trackedNames);
  } else {
    // Try again in 200ms
    setTimeout(updateMatrix, 200);
  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Update the parallel coordinates plot
function updateDependantElements() {
  // This function will be defined in draw_plot.js
  // We'll call it here to update the plot when filters change

  if (typeof updateChart === 'function') {
    // Pass the current tracking and encyclopedia state to updateChart
    const trackedNames = new Set();
    const namesForMap = new Set();

    characters
      .filter(char => trackedCharacters.has(char.id))
      .forEach(char => {
        if (char.appears_in?.includes("map")) {
          namesForMap.add(char.name);
        }
        if (char.appears_in?.includes("plot")) {
          trackedNames.add(char.name)
        }
      });
    // Call the updateChart function from draw_plot.js
    
    updateChart(undefined, trackedNames, selectedEncyclopedias);
    updateMap(namesForMap);
  }
}
window.updateDependantElements = updateDependantElements;

// Initialize the sidebar when the DOM is ready
document.addEventListener("DOMContentLoaded", initSidebar);