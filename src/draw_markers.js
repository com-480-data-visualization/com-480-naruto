async function updateMap(nameSet) {
  const container = document.getElementById('image-container');
  container.querySelectorAll('.pin-wrapper').forEach(el => el.remove());

  const [characters, locations] = await Promise.all([
    fetch('./characters.json').then(res => res.json()),
    fetch('./locations.json').then(res => res.json())
  ]);

  const nameToBirthplace = new Map();
  characters.forEach(c => nameToBirthplace.set(c.name, c.place_of_birth));

  const nameToAvatar = new Map();
  characters.forEach(c => nameToAvatar.set(c.name, c.avatar));

  const locationMap = new Map();
  locations.forEach(l => locationMap.set(l.location, { x: l.x, y: l.y }));

  const coordMap = new Map();

  nameSet.forEach(name => {
    const birthplace = nameToBirthplace.get(name);
    if (!birthplace) return;

    const coords = locationMap.get(birthplace);
    if (!coords) return;

    const key = `${coords.x},${coords.y}`;
    if (!coordMap.has(key)) coordMap.set(key, { coords, names: [] });
    coordMap.get(key).names.push(name);
  });

  for (const { coords, names } of coordMap.values()) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pin-wrapper';

    const height = 42 * (names.length - 1);
    wrapper.style.left = coords.x + 'px';
    wrapper.style.top = coords.y - height + 'px';


    // === CAP ===
    // const cap = document.createElement('div');
    // cap.className = 'pin-cap';

    const circle = document.createElement('div');
    circle.className = 'pin-cap-circle';

    const avatar = document.createElement('div');
    avatar.className = 'pin-avatar';

    const topImg = document.createElement('img');
    topImg.src = nameToAvatar.get(names[0]);
    topImg.alt = names[0];
    topImg.title = names[0];

    avatar.appendChild(topImg);
    circle.appendChild(avatar);
    wrapper.appendChild(circle);

    // === ORANGE BODY ===
    if (names.length > 1) {
      const bodyHeight = 42 * (names.length - 1);
      const body = document.createElement('div');
      body.className = 'pin-body';
      body.style.height = bodyHeight + 'px';
      body.style.top = "21px";

      for (let i = 1; i < names.length; i++) {
        const avatar = document.createElement('div');
        avatar.className = 'pin-avatar';
        avatar.style.top = `${42 * (i-1) + 21}px`;

        const img = document.createElement('img');
        img.src = nameToAvatar.get(names[i]);
        img.alt = names[i];
        img.title = names[i];

        avatar.appendChild(img);
        body.appendChild(avatar);
      }

      wrapper.appendChild(body);
    }

    // === TAIL ===
    const tail = document.createElement('div');
    tail.className = 'pin-tail';
    tail.style.top = `${42 * Math.max(0, names.length - 1)}px`;

    wrapper.appendChild(tail);
    container.appendChild(wrapper);
  }
}