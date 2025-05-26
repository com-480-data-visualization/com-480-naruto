let characters = [];
const listEl = document.getElementById("character-list");
const detailsEl = document.getElementById("character-details");
const searchEl = document.getElementById("search");

let checked = new Set();

async function fetchCharacters() {
    const response = await fetch("characters.json");
    characters = await response.json();
    renderList();
}

function renderList(filter = "") {
    listEl.innerHTML = "";
    characters
        .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
        .forEach(character => {
            const item = document.createElement("div");
            item.className = "list-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = checked.has(character.id);
            checkbox.addEventListener("click", e => {
                e.stopPropagation();
                if (checked.has(character.id)) {
                    checked.delete(character.id);
                } else {
                    checked.add(character.id);
                }
            });

            const label = document.createElement("span");
            label.textContent = character.name;

            item.appendChild(checkbox);
            item.appendChild(label);

            item.addEventListener("click", () => renderDetails(character));

            listEl.appendChild(item);
        });
}

function renderDetails(character) {
    detailsEl.innerHTML = `
            <div class="details-container">
                <img src="${character.avatar}" alt="${character.name}" class="avatar">
                <div>
                    <h2 class="character-name">${character.name}</h2>
                    <p class="character-description">${character.description}</p>
                </div>
            </div>
        `;
}

searchEl.addEventListener("input", () => renderList(searchEl.value));

fetchCharacters();