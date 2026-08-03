/* ===================================================
   Campus Informativo · Contadores — counterapi.dev
   - Visitas: se incrementa una vez por sesión
   - Descargas: se incrementa al clickear PDF/Drive/Classroom
   =================================================== */

const COUNTER_NS = 'cecpuna-2dosemestre';
const API_BASE   = 'https://counterapi.dev/api';

// ── Utilidad: fetch silencioso ──
async function counterFetch(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ── Formatear número con separador de miles ──
function fmtNum(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('es-PY');
}

// ===== VISITAS =====
async function iniciarContadorVisitas() {
  const el = document.getElementById('stat-visitas');
  if (!el) return;
  // Solo incrementa una vez por sesión de navegador
  const ya = sessionStorage.getItem('visita-contada');
  let data;
  if (!ya) {
    data = await counterFetch(`${API_BASE}/${COUNTER_NS}/visitas/up`);
    sessionStorage.setItem('visita-contada', '1');
  } else {
    data = await counterFetch(`${API_BASE}/${COUNTER_NS}/visitas`);
  }
  el.textContent = fmtNum(data?.value);
}

// ===== DESCARGAS =====
async function iniciarContadorDescargas() {
  const el = document.getElementById('stat-descargas');
  if (!el) return;
  const data = await counterFetch(`${API_BASE}/${COUNTER_NS}/descargas`);
  el.textContent = fmtNum(data?.value);
}

async function incrementarDescarga(etiqueta) {
  const el = document.getElementById('stat-descargas');
  const data = await counterFetch(`${API_BASE}/${COUNTER_NS}/descargas/up`);
  if (el && data?.value != null) el.textContent = fmtNum(data.value);
  // Contador individual por recurso
  const slug = etiqueta
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  if (slug) await counterFetch(`${API_BASE}/${COUNTER_NS}/dl-${slug}/up`);
}

// ===== EVENT DELEGATION — captura clicks en links de descarga ──
function initClickListeners() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href][target="_blank"]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const esPDF     = /\.pdf/i.test(href);
    const esDrive   = href.includes('drive.google.com') || href.includes('docs.google.com');
    const esClassrm = href.includes('classroom.google.com');
    if (!esPDF && !esDrive && !esClassrm) return;
    const etiqueta = a.closest('[data-materia]')?.dataset.materia
                  || a.textContent.trim()
                  || new URL(href).hostname;
    incrementarDescarga(etiqueta);
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  iniciarContadorVisitas();
  iniciarContadorDescargas();
  initClickListeners();
});
