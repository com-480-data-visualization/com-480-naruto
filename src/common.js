// const [characters, locations] = await Promise.all([
//     fetch('./characters.json').then(res => res.json()),
//     fetch('./locations.json').then(res => res.json())
// ]);
const charactersP = fetch('./characters.json').then(res => res.json()).catch(error => {
    console.error("Error loading characters.json:", error);
});
const locationsP = fetch('./locations.json').then(res => res.json()).catch(error => {
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


async function buildCoordMap() {
  const [nameToBirthplace, locationMap] = await Promise.all([
    nameToBirthplaceP,
    locationMapP
  ]);

  const coordMap = new Map();

  nameSet.forEach(name => {
    const birthplace = nameToBirthplace.get(name);
    if (!birthplace) return;

    const coords = locationMap.get(birthplace);
    if (!coords) return;

    const key = `${coords.x},${coords.y}`;
    if (!coordMap.has(key)) {
      coordMap.set(key, { coords, names: [] });
    }
    coordMap.get(key).names.push(name);
  });

  return coordMap;
}

const coordMapP = buildCoordMap