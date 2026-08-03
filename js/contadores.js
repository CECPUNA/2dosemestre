/* ===================================================
   Campus Informativo · Contadores — counterapi.dev V2
   Workspace : cecpuna-2dosemestre
   - Visitas  : se incrementa una vez por sesión
   - Descargas: se incrementa al clickear PDF/Drive/Classroom
   ⚠️  Token expuesto intencionalmente (sitio estático GitHub Pages).
       Riesgo aceptado por el administrador del proyecto.
   =================================================== */

const COUNTER_WS    = 'cecpuna-2dosemestre';
const COUNTER_TOKEN = 'ut_SWltJdLsQjk2O9fpJTiLpqwtcH2jDELeZ3Egafdp';
const API_BASE_V2   = 'https://api.counterapi.dev/v2';

// ── Utilidad: fetch con Authorization header ──
async function counterFetch(endpoint, hit = false) {
  try {
    const url    = `${API_BASE_V2}/${COUNTER_WS}/${endpoint}${hit ? '/up' : ''}`;
    const r      = await fetch(url, {
      headers: { Authorization: `Bearer ${COUNTER_TOKEN}` }
    });
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
  const ya   = sessionStorage.getItem('visita-contada');
  const data = await counterFetch('visitas', !ya);   // hit=true solo la primera vez
  if (!ya) sessionStorage.setItem('visita-contada', '1');
  el.textContent = fmtNum(data?.count ?? data?.value);
}

// ===== DESCARGAS =====
async function iniciarContadorDescargas() {
  const el = document.getElementById('stat-descargas');
  if (!el) return;
  const data = await counterFetch('descargas', false);
  el.textContent = fmtNum(data?.count ?? data?.value);
}

async function incrementarDescarga(etiqueta) {
  const el   = document.getElementById('stat-descargas');
  const data = await counterFetch('descargas', true);
  if (el && (data?.count ?? data?.value) != null) {
    el.textContent = fmtNum(data.count ?? data.value);
  }
  // Contador individual por recurso
  const slug = etiqueta
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  if (slug) await counterFetch(`dl-${slug}`, true);
}

// ===== EVENT DELEGATION — captura clicks en links de descarga =====
function initClickListeners() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href][target="_blank"]');
    if (!a) return;
    const href      = a.getAttribute('href') || '';
    const esPDF     = /\.pdf/i.test(href);
    const esDrive   = href.includes('drive.google.com') || href.includes('docs.google.com');
    const esClassrm = href.includes('classroom.google.com');
    if (!esPDF && !esDrive && !esClassrm) return;
    const etiqueta  = a.closest('[data-materia]')?.dataset.materia
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
