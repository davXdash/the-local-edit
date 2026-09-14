const map = L.map('map', { zoomControl: true, scrollWheelZoom: true }).setView([51.4368, 7.0055], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);
let places = [];
let activeFilter = 'all';

const markerIcon = (anchor = false) => L.divIcon({
  className: '',
  html: `<div class="custom-marker${anchor ? ' anchor' : ''}"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28]
});

const fireStation = L.marker([51.4315, 7.0121], { icon: markerIcon(true) })
  .addTo(map)
  .bindPopup('<div class="place-popup"><h3>Feuerwache</h3><p>Neutraler Bezugspunkt für spätere Distanzangaben.</p></div>');

function popupHtml(place) {
  return `
    <div class="place-popup">
      <h3>${place.name}</h3>
      <p>${place.type}</p>
      <div class="popup-tags">${place.tags.map(tag => `<span>${tag.replace('-', ' ')}</span>`).join('')}</div>
    </div>
  `;
}

function renderMarkers() {
  markerLayer.clearLayers();
  const visible = places.filter(place => activeFilter === 'all' || place.tags.includes(activeFilter));

  visible.forEach(place => {
    L.marker([place.lat, place.lng], { icon: markerIcon(false) })
      .bindPopup(popupHtml(place))
      .addTo(markerLayer);
  });
}

function renderCards() {
  const grid = document.querySelector('#place-grid');
  const visible = places.filter(place => activeFilter === 'all' || place.tags.includes(activeFilter));

  grid.innerHTML = visible.map(place => `
    <article class="place-card">
      <div>
        <div class="meta">${place.area.toUpperCase()} · ${place.type.toUpperCase()}</div>
        <h3>${place.name}</h3>
        <p>${place.note}</p>
      </div>
      <div class="tags">${place.tags.map(tag => `<span>${tag.replace('-', ' ')}</span>`).join('')}</div>
    </article>
  `).join('');

  if (!visible.length) {
    grid.innerHTML = '<p>Für diesen Filter sind noch keine Orte eingetragen.</p>';
  }
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter').forEach(button => {
    button.classList.toggle('active', button.dataset.filter === filter);
  });
  renderMarkers();
  renderCards();
}

fetch('data/places.json')
  .then(response => {
    if (!response.ok) throw new Error('Ortsdaten konnten nicht geladen werden.');
    return response.json();
  })
  .then(data => {
    places = data;
    renderMarkers();
    renderCards();
  })
  .catch(error => {
    console.error(error);
    document.querySelector('#place-grid').innerHTML = '<p>Die Ortsdaten konnten gerade nicht geladen werden.</p>';
  });

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});

window.addEventListener('resize', () => map.invalidateSize());
