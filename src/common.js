const charactersP = fetch('../data/characters.json').then(res => res.json()).catch(error => {
    console.error("Error loading characters.json:", error);
});
const locationsP = fetch('../data/locations.json').then(res => res.json()).catch(error => {
    console.error("Error loading locations.json:", error);
});

const nameToBirthplaceP = charactersP.then(charList => 
  new Map(charList.map(c => [c.name, c.place_of_birth]))
);

const nameToAvatarP = charactersP.then(charList => 
   new Map(charList.map(c => [c.name, c.avatar]))
)
const locationMapP = locationsP.then(locList => 
  new Map(locList.map(l => [l.location, { x: l.x, y: l.y }]))
);

const charStatsP = d3.csv("../data/char_stats.csv").then(data => {
  return data;
}).catch(error => {
  console.error("Error loading character statistics data:", error);
});
const coocMatrixP = d3.json("../data/naruto_cooccurrence.json")
  .then(data => data)
  .catch(error => {
    console.error("Error loading naruto_cooccurrence.json for cooccurrence matrix:", error);
    return null;
});
