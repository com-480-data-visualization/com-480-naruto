async function drawSmall(names, wrapper, nameToAvatar) {
  const bodyHeight = 42 * names.length;
  const body = document.createElement('div');
  body.className = 'pin-body';
  body.style.height = bodyHeight + 'px';
  body.style.top = "0px";


  for (let i = 0; i < names.length; i++) {
    const avatar = document.createElement('div');
    avatar.className = 'pin-avatar';
    avatar.style.top = `${42 * (i)}px`;

    const img = document.createElement('img');
    img.src = nameToAvatar.get(names[i]);
    img.alt = names[i];
    img.title = names[i];

    avatar.appendChild(img);
    body.appendChild(avatar);
  }

  wrapper.appendChild(body);
}

async function drawBig(names, wrapper, nameToAvatar) {
  const rows = Math.min(names.length, 5)
  const cols = ((names.length + 4) / 5) | 0;
  console.log('cols:', cols);

  const bodyHeight = 42 * rows;
  const bodyWidth = 42 * cols;

  const body = document.createElement('div');
  body.classList.add('pin-body', 'big-pin');
  body.style.height = bodyHeight + 'px';
  body.style.width = bodyWidth + 'px';
  body.style.top = "0px";
  body.style.zIndex = "11";

  for (let i = 0; i < names.length; i++) {
    const row = i % 5;
    const col = (i / 5) | 0;

    const avatar = document.createElement('div');
    avatar.classList.add('pin-avatar', 'big-pin');
    avatar.style.top = `${42 * row}px`;
    avatar.style.left = `${42 * col}px`;

    const img = document.createElement('img');
    img.src = nameToAvatar.get(names[i]);
    img.alt = names[i];
    img.title = names[i];
    img.zIndex = "12";

    avatar.appendChild(img);
    body.appendChild(avatar);
  }
  body.addEventListener('mouseleave', () => {
    wrapper.querySelectorAll('.big-pin').forEach(el => el.remove());
  }
  )

  wrapper.appendChild(body);
}

async function drawFolded(names, wrapper, nameToAvatar) {
  const bodyHeight = 42 * 3;
  const body = document.createElement('div');
  body.className = 'pin-body';
  body.style.height = bodyHeight + 'px';
  body.style.top = "0px";

  {
    const avatar = document.createElement('div');
    avatar.className = 'pin-avatar';
    avatar.style.top = `0px`;

    const img = document.createElement('img');
    img.src = "./profile_pictures/manymore.png"
    img.alt = "other";
    img.title = "other";
    img.addEventListener('mouseenter', () => {
      drawBig(names, wrapper, nameToAvatar);
    });


    avatar.appendChild(img);
    body.appendChild(avatar);
  }

  for (let i = 0; i < 2; i++) {
    const avatar = document.createElement('div');
    avatar.className = 'pin-avatar';
    avatar.style.top = `${42 * (i + 1)}px`;

    const img = document.createElement('img');
    img.src = nameToAvatar.get(names[i]);
    img.alt = names[i];
    img.title = names[i];

    avatar.appendChild(img);
    body.appendChild(avatar);
  }

  wrapper.appendChild(body);
}

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

    const tail = document.createElement('div');
    tail.className = 'pin-tail';

    var height;
    // === ORANGE BODY ===
    if (names.length <= 3) {
      await drawSmall(names, wrapper, nameToAvatar);
      tail.style.top = `${42 * Math.max(0, names.length - 1)}px`;
      height = 42 * (names.length - 1);
    } else {
      await drawFolded(names, wrapper, nameToAvatar);
      // await drawBig(names, wrapper, nameToAvatar);
      tail.style.top = `${42 * 2}px`;
      height = 42 * 2;
    }

    wrapper.style.top = coords.y - height + 'px';
    wrapper.style.left = coords.x + 'px';

    // === TAIL ===

    wrapper.appendChild(tail);
    container.appendChild(wrapper);
  }
}