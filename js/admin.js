/* ================================================
   Campus Informativo · admin.js
   Panel de gestión del 2do Semestre
   ================================================ */

// Auth guard
if (!sessionStorage.getItem('adminOk')) {
  window.location.href = 'login.html';
}

document.getElementById('btnSalir').addEventListener('click', () => {
  sessionStorage.removeItem('adminOk');
});

// ===== DATA EN MEMORIA =====
let D = null;

fetch('../data/2do.json')
  .then(r => r.json())
  .then(d => { D = JSON.parse(JSON.stringify(d)); initDashboard(); })
  .catch(() => { D = { noticias:[], horario:[], examenes:[], calendario:[], programas:[], libros:[], drive:[] }; initDashboard(); });

// ===== NAVEGACIÓN SIDEBAR =====
document.querySelectorAll('[data-panel]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-panel]').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    const panel = document.getElementById('panel-' + el.dataset.panel);
    if (panel) {
      panel.classList.add('active');
      renderPanel(el.dataset.panel);
    }
  });
});

function renderPanel(nombre) {
  if (nombre === 'noticias')   renderNoticiasAdmin();
  if (nombre === 'horario')    renderHorarioAdmin();
  if (nombre === 'examenes')   renderExamenesAdmin();
  if (nombre === 'calendario') renderCalendarioAdmin();
  if (nombre === 'programas')  renderProgramasAdmin();
  if (nombre === 'libros')     renderLibrosAdmin();
  if (nombre === 'drive')      renderDriveAdmin();
  if (nombre === 'exportar')   exportarJSON();
}

function initDashboard() {
  const stats = [
    { label:'Noticias',    valor: D.noticias?.length || 0,   color:'#1a237e', icon:'bi-megaphone' },
    { label:'Clases/sem',  valor: D.horario?.length || 0,    color:'#2e7d32', icon:'bi-clock' },
    { label:'Exámenes',    valor: D.examenes?.length || 0,   color:'#c62828', icon:'bi-journal-check' },
    { label:'Libros',      valor: D.libros?.length || 0,     color:'#e65100', icon:'bi-book' },
  ];
  document.getElementById('statsRow').innerHTML = stats.map(s => `
    <div class="col-6 col-md-3">
      <div class="stat-card d-flex align-items-center gap-3">
        <div class="icon" style="background:${s.color}20"><i class="bi ${s.icon}" style="color:${s.color}"></i></div>
        <div><div class="fw-bold fs-4" style="color:${s.color}">${s.valor}</div><div class="small text-muted">${s.label}</div></div>
      </div>
    </div>`).join('');
}

// ===== NOTICIAS =====
function renderNoticiasAdmin() {
  const c = document.getElementById('listaNoticiasAdmin');
  if (!D.noticias?.length) { c.innerHTML = '<p class="text-muted">Sin noticias.</p>'; return; }
  c.innerHTML = D.noticias.map((n,i) => `
    <div class="col-12 col-md-6">
      <div class="card border-0 shadow-sm p-3 h-100">
        <div class="d-flex justify-content-between">
          <span class="badge" style="background:${n.urgente?'#c62828':'#3949ab'}">${n.tipo||'Aviso'}</span>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminar('noticias',${i})"><i class="bi bi-trash"></i></button>
        </div>
        <div class="fw-bold mt-2">${n.titulo}</div>
        <div class="small text-muted">${n.descripcion||''}</div>
      </div>
    </div>`).join('');
}
function agregarNoticia() {
  const tit = document.getElementById('noTit').value.trim();
  if (!tit) return;
  D.noticias.push({
    titulo: tit,
    descripcion: document.getElementById('noDesc').value.trim(),
    tipo: document.getElementById('noTipo').value.trim() || 'Aviso',
    fecha: document.getElementById('noFecha').value.trim(),
    urgente: document.getElementById('noUrgente').checked
  });
  renderNoticiasAdmin();
  ['noTit','noDesc','noTipo','noFecha'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('noUrgente').checked = false;
}

// ===== HORARIO =====
function renderHorarioAdmin() {
  const t = document.getElementById('tablaHorarioAdmin');
  let html = '<thead><tr><th>Día</th><th>Hora</th><th>Materia</th><th>Profesor</th><th></th></tr></thead><tbody>';
  (D.horario || []).forEach((c,i) => {
    html += `<tr><td>${c.dia}</td><td>${c.hora}</td><td>${c.materia}</td><td>${c.profesor||''}</td><td><button class="btn btn-sm btn-outline-danger" onclick="eliminar('horario',${i})"><i class="bi bi-trash"></i></button></td></tr>`;
  });
  html += '</tbody>';
  t.innerHTML = html;
}
function agregarHorario() {
  const dia = document.getElementById('hDia').value;
  const hora = document.getElementById('hHora').value.trim();
  const mat  = document.getElementById('hMateria').value;
  const prof = document.getElementById('hProf').value.trim();
  if (!hora) return;
  D.horario.push({ dia, hora, materia: mat, profesor: prof });
  renderHorarioAdmin();
  document.getElementById('hHora').value = '';
  document.getElementById('hProf').value = '';
}

// ===== EXÁMENES =====
function renderExamenesAdmin() {
  const c = document.getElementById('listaExamenesAdmin');
  if (!D.examenes?.length) { c.innerHTML = '<p class="text-muted">Sin exámenes.</p>'; return; }
  c.innerHTML = D.examenes.map((e,i) => `
    <div class="col-12 col-md-6">
      <div class="card border-0 shadow-sm p-3 h-100">
        <div class="d-flex justify-content-between">
          <span class="badge bg-primary">${e.tipo}</span>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminar('examenes',${i})"><i class="bi bi-trash"></i></button>
        </div>
        <div class="fw-bold mt-2">${e.materia}</div>
        <div class="small text-muted">${e.fecha} ${e.hora} · Aula ${e.aula||'-'} · ${e.profesor||''}</div>
      </div>
    </div>`).join('');
}
function agregarExamen() {
  const mat = document.getElementById('exMat').value;
  const fec = document.getElementById('exFecha').value.trim();
  if (!fec) return;
  D.examenes.push({
    materia: mat,
    tipo: document.getElementById('exTipo').value,
    fecha: fec,
    hora: document.getElementById('exHora').value.trim(),
    aula: document.getElementById('exAula').value.trim(),
    profesor: document.getElementById('exProf').value.trim()
  });
  renderExamenesAdmin();
  ['exFecha','exHora','exAula','exProf'].forEach(id => document.getElementById(id).value = '');
}

// ===== CALENDARIO =====
function renderCalendarioAdmin() {
  const c = document.getElementById('listaCalendarioAdmin');
  if (!D.calendario?.length) { c.innerHTML = '<p class="text-muted">Sin períodos.</p>'; return; }
  c.innerHTML = D.calendario.map((p,i) => `
    <div class="col-12 col-md-4">
      <div class="card border-0 shadow-sm p-3 h-100">
        <div class="d-flex justify-content-between">
          <span class="badge" style="background:${p.tipo==='final'?'#e65100':p.tipo==='parcial'?'#c62828':'#3949ab'}">${p.tipo}</span>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminar('calendario',${i})"><i class="bi bi-trash"></i></button>
        </div>
        <div class="fw-bold mt-2">${p.mes}</div>
        <div class="small text-muted">${p.nombre} ${p.fecha||''}</div>
      </div>
    </div>`).join('');
}
function agregarCalendario() {
  const mes = document.getElementById('calMes').value.trim();
  if (!mes) return;
  D.calendario.push({
    mes, nombre: document.getElementById('calNom').value.trim(),
    fecha: document.getElementById('calFecha').value.trim(),
    tipo: document.getElementById('calTipo').value
  });
  renderCalendarioAdmin();
  ['calMes','calNom','calFecha'].forEach(id => document.getElementById(id).value = '');
}

// ===== PROGRAMAS =====
function renderProgramasAdmin() {
  const c = document.getElementById('listaProgramasAdmin');
  c.innerHTML = (D.programas || []).map((p,i) => `
    <div class="col-12 col-md-6">
      <div class="card border-0 shadow-sm p-3">
        <div class="fw-bold">${p.materia}</div>
        <div class="small text-muted mt-1">${p.pdf ? `<a href="${p.pdf}" target="_blank">Ver PDF</a>` : 'Sin PDF'}</div>
      </div>
    </div>`).join('');
}
function guardarPrograma() {
  const mat = document.getElementById('pgMat').value;
  const url = document.getElementById('pgUrl').value.trim();
  const idx = D.programas.findIndex(p => p.materia === mat);
  if (idx >= 0) D.programas[idx].pdf = url;
  else D.programas.push({ materia: mat, descripcion: '', pdf: url });
  renderProgramasAdmin();
  document.getElementById('pgUrl').value = '';
}

// ===== LIBROS =====
function renderLibrosAdmin() {
  const c = document.getElementById('listaLibrosAdmin');
  if (!D.libros?.length) { c.innerHTML = '<p class="text-muted">Sin libros.</p>'; return; }
  c.innerHTML = D.libros.map((l,i) => `
    <div class="col-12 col-md-6">
      <div class="card border-0 shadow-sm p-3">
        <div class="d-flex justify-content-between">
          <div><div class="fw-bold">${l.titulo}</div><div class="small text-muted">${l.autor||''} · ${l.materia||''}</div></div>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminar('libros',${i})"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>`).join('');
}
function agregarLibro() {
  const tit = document.getElementById('lbTit').value.trim();
  if (!tit) return;
  D.libros.push({
    materia: document.getElementById('lbMat').value.trim(),
    titulo: tit,
    autor: document.getElementById('lbAut').value.trim(),
    pdf: document.getElementById('lbPdf').value.trim(),
    imagen: document.getElementById('lbImg').value.trim()
  });
  renderLibrosAdmin();
  ['lbMat','lbTit','lbAut','lbPdf','lbImg'].forEach(id => document.getElementById(id).value = '');
}

// ===== DRIVE =====
function renderDriveAdmin() {
  const c = document.getElementById('listaDriveAdmin');
  c.innerHTML = (D.drive || []).map((d,i) => `
    <div class="col-12 col-md-6">
      <div class="card border-0 shadow-sm p-3">
        <div class="fw-bold">${d.materia}</div>
        <div class="small text-muted">${d.url ? `<a href="${d.url}" target="_blank">Abrir Drive</a>` : 'Sin enlace'}</div>
      </div>
    </div>`).join('');
}
function guardarDrive() {
  const mat = document.getElementById('drMat').value;
  const url = document.getElementById('drUrl').value.trim();
  const idx = D.drive.findIndex(d => d.materia === mat);
  if (idx >= 0) D.drive[idx].url = url;
  else D.drive.push({ materia: mat, descripcion: 'Carpeta del docente', url });
  renderDriveAdmin();
  document.getElementById('drUrl').value = '';
}

// ===== ELIMINAR GENÉRICO =====
function eliminar(seccion, idx) {
  if (!confirm('¿Eliminar este elemento?')) return;
  D[seccion].splice(idx, 1);
  renderPanel(seccion === 'calendario' ? 'calendario' : seccion);
}

// ===== EXPORTAR JSON =====
function exportarJSON() {
  const json = JSON.stringify(D, null, 2);
  document.getElementById('jsonOutput').textContent = json;
  navigator.clipboard?.writeText(json).then(() => {
    const btn = document.querySelector('#panel-exportar .btn-una');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>¡Copiado!';
    btn.style.background = '#2e7d32';
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
  });
}
