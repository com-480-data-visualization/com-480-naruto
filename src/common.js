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
