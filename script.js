// script.js
document.addEventListener('DOMContentLoaded', init);

let photos = [];
let currentIndex = 0;
let currentFilter = 'todas';

async function init() {
  try {
    await loadGallery();
    setupModal();
    updateCoverImage();
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('gallery').innerHTML = '<p style="text-align:center;color:#ccc;">Error al cargar la galería.</p>';
  }
}

async function loadGallery() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.sheetId}/values/${CONFIG.sheetName}?key=${CONFIG.apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const rows = data.values || [];

  if (rows.length < 2) return;

  const [headers, ...body] = rows.slice(1);
  const eventTitle = body[0][2];
  const eventDate = body[0][3];

  document.getElementById('event-title').textContent = eventTitle;
  document.getElementById('event-date').textContent = eventDate;
  document.getElementById('photographer').textContent = CONFIG.photographer;

  photos = body.map(row => ({
    sesion: row[0] || 'Sin sesión',
    url: row[1],
    desc: row[4] || ''
  })).filter(p => p.url);

  renderFilters();
  filterPhotos('todas');
}

function renderFilters() {
  const container = document.getElementById('filters');
  container.innerHTML = '';

  const allBtn = createFilterBtn('Todas las Sesiones', 'todas', true);
  container.appendChild(allBtn);

  const sesiones = [...new Set(photos.map(p => p.sesion))].sort();
  sesiones.forEach(s => container.appendChild(createFilterBtn(s, s)));
}

function createFilterBtn(text, value, active = false) {
  const btn = document.createElement('button');
  btn.className = `filter-btn ${active ? 'active' : ''}`;
  btn.textContent = text;
  btn.dataset.sesion = value;
  btn.onclick = () => filterPhotos(value);
  return btn;
}

function filterPhotos(sesion) {
  currentFilter = sesion;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-sesion="${sesion}"]`).classList.add('active');

  const filtered = sesion === 'todas' ? photos : photos.filter(p => p.sesion === sesion);
  renderGallery(filtered);
}

function renderGallery(items) {
  const container = document.getElementById('gallery');
  container.innerHTML = '';

  items.forEach((photo, i) => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.onclick = () => openModal(i, items);

    card.innerHTML = `
      <img src="${photo.url}" alt="Foto ${i+1}" loading="lazy">
      <div class="photo-overlay"><span>Ver foto</span></div>
    `;

    container.appendChild(card);
  });
}

function openModal(index, list) {
  currentIndex = index;
  const modal = document.getElementById('modal');
  const img = document.getElementById('modal-img');
  img.src = list[index].url;
  modal.style.display = 'flex';
}

function changePhoto(direction) {
  const list = currentFilter === 'todas' ? photos : photos.filter(p => p.sesion === currentFilter);
  currentIndex = (currentIndex + direction + list.length) % list.length;
  document.getElementById('modal-img').src = list[currentIndex].url;
}

function setupModal() {
  const modal = document.getElementById('modal');
  const close = document.querySelector('.close');
  const prev = document.querySelector('.prev');
  const next = document.querySelector('.next');

  close.onclick = () => modal.style.display = 'none';
  prev.onclick = () => changePhoto(-1);
  next.onclick = () => changePhoto(1);
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

function updateCoverImage() {
  document.querySelector('.cover').style.backgroundImage = `url('${CONFIG.coverImage}')`;
}

// Tecla ESC para cerrar modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.getElementById('modal').style.display = 'none';
  if (e.key === 'ArrowLeft') changePhoto(-1);
  if (e.key === 'ArrowRight') changePhoto(1);
});
