const markers = [
    { x: 225, y: 225 },
  ];

  const container = document.getElementById('image-container');

  markers.forEach(marker => {
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.left = marker.x + 'px';
    el.style.top = marker.y + 'px';
    container.appendChild(el);
  });