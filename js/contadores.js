/* ===================================================
   Campus Informativo · Contadores — counterapi.dev V2
   Workspace : cecpuna-2dosemestre
   Slugs     : visitas2do | descargas2do
   - Visitas  : se incrementa una vez por sesión
   - Descargas: se incrementa al clickear PDF/Drive/Classroom
   ⚠️  Token expuesto intencionalmente (sitio estático GitHub Pages).
       Riesgo aceptado por el administrador del proyecto.
   =================================================== */

const COUNTER_WS      = 'cecpuna-2dosemestre';
const COUNTER_TOKEN   = 'ut_SWltJdLsQjk2O9fpJTiLpqwtcH2jDELeZ3Egafdp';
const API_BASE_V2     = 'https://api.counterapi.dev/v2';
const SLUG_VISITAS    = 'visitas2do';
const SLUG_DESCARGAS  = 'descargas2do';

// ── Utilidad: fetch con Authorization header ──
async function counterFetch(slug, hit = false) {
  try {
    const url = `${API_BASE_V2}/${COUNTER_WS}/${slug}${hit ? '/up' : ''}`;
    const r   = await fetch(url, {
      headers: { Authorization: `Bearer ${COUNTER_TOKEN}` }
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ── Leer valor de la respuesta V2 ──
function getCount(data) {
  // V2 devuelve { data: { up_count, down_count } }
  if (data?.data?.up_count != null) return data.data.up_count - (data.data.down_count || 0);
  // fallback por si cambia el esquema
  return data?.count ?? data?.value ?? null;
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
  const data = await counterFetch(SLUG_VISITAS, !ya);   // hit=true solo la primera vez
  if (!ya) sessionStorage.setItem('visita-contada', '1');
  el.textContent = fmtNum(getCount(data));
}

// ===== DESCARGAS =====
async function iniciarContadorDescargas() {
  const el = document.getElementById('stat-descargas');
  if (!el) return;
  const data = await counterFetch(SLUG_DESCARGAS, false);
  el.textContent = fmtNum(getCount(data));
}

async function incrementarDescarga(etiqueta) {
  const el   = document.getElementById('stat-descargas');
  const data = await counterFetch(SLUG_DESCARGAS, true);
  const n    = getCount(data);
  if (el && n != null) el.textContent = fmtNum(n);
  // Contador individual por recurso (slug derivado de la etiqueta)
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
