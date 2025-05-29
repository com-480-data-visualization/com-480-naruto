## Milestone 2 (18th April, 5pm)
### [Website MVP Link](https://com-480-data-visualization.github.io/com-480-naruto/)

### Project Overview

Our project consists of **4 core visualizations**, each of which can be developed simultaneously by the team members. Below we list each visualization along with the necessary tools and additional ideas.

---

### 1. Battle Co-occurrence Matrix 🥷⚔

#### Data Storytelling
- Rows and columns represent characters.
- Cells represent battles where these characters fought against each other.

#### Tools
- Example: [Les Misérables co-occurrence matrix](https://bost.ocks.org/mike/miserables/)
- Libraries: `d3.v6.min.js`

#### Ideas
- **Brushing**: Show the exact number of fights between characters when hovering over a cell.
- **Potential addition**: Display descriptions of major battles when relevant.

---

### 2. Map 🗺

#### Data Storytelling
- The map provides spatial insights into key events in the series, such as battles and character birthplaces.

#### Tools
- Libraries: `d3.v6.min.js` possibly

**Note**: Since our map is fictional, we cannot rely on public APIs with real-world geodata. However, we aim to make the map highly interactive.So we will display marks on picture of map almost mannualy on js.

#### Ideas
- **Brushing**: Display the list of characters born in the selected village.
- **Filtering**: Allow users to display only chosen characters on the map.

---

### 3. Character Statistics 📊

#### Data Storytelling
- Visualizing character statistics across different time periods (specifically, 3 official books for different time periods) gives insight into how their abilities evolve over time and help compare the characters to each other.

#### Tools
- D3 examples repository
- Libraries: `d3.min.js`

#### Ideas
- **Filtering**: Allow users to select a subset of characters (e.g., via checkboxes) to reduce visual noise.

---

### 4. Character Cards (Profiles) 🪪

#### Data Storytelling
- Profiles of the main characters featuring their pictures and short biographies.

#### Tools
- just `js` to generate `html`

#### Ideas
- **Filtering**: Filtering for other parts of website is based on this list, it allows users to choose subset of characters for further display.