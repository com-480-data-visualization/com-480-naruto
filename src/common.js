// const [characters, locations] = await Promise.all([
//     fetch('./characters.json').then(res => res.json()),
//     fetch('./locations.json').then(res => res.json())
// ]);
const characters = fetch('./characters.json').then(res => res.json()).catch(error => {
    console.error("Error loading characters.json:", error);
});
const locations = fetch('./locations.json').then(res => res.json()).catch(error => {
    console.error("Error loading locations.json:", error);
});

const nameToBirthplace = characters.then(charList => 
  new Map(charList.map(c => [c.name, c.place_of_birth]))
);

const nameToAvatar = characters.then(charList => 
   new Map(charList.map(c => [c.name, c.avatar]))
)
const locationMap = locations.then(locList => 
  new Map(locList.map(l => [l.location, { x: l.x, y: l.y }]))
);


async function buildCoordMap() {
  const [nameToBirthplaceV, locationMapV] = await Promise.all([
    nameToBirthplace,
    locationMap
  ]);

  const coordMap = new Map();

  nameSet.forEach(name => {
    const birthplace = nameToBirthplaceV.get(name);
    if (!birthplace) return;

    const coords = locationMapV.get(birthplace);
    if (!coords) return;

    const key = `${coords.x},${coords.y}`;
    if (!coordMap.has(key)) {
      coordMap.set(key, { coords, names: [] });
    }
    coordMap.get(key).names.push(name);
  });

  return coordMap;
}

const coordMap = buildCoordMap