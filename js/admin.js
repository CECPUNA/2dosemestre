/* ===================================================
   Gestor de Contenidos · 2do Semestre
   admin.js — CRUD + localStorage + GitHub API publish
   =================================================== */

const LS_KEY    = 'cms_2do_2026';
const GH_REPO   = 'CECPUNA/2dosemestre';
const GH_PATH   = 'data/2do.json';
const GH_BRANCH = 'main';
const LS_TOKEN  = 'gh_token_cms';

const RAW_URL = `https://raw.githubusercontent.com/${GH_REPO}/${GH_BRANCH}/${GH_PATH}`;

const MATERIAS = [
  'Economía Política',
  'Introducción a las Ciencias Políticas',
  'Historia Política Paraguaya',
  'Idioma Guaraní II',
  'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)'
];

let D     = null;
let ghSHA = null;

document.addEventListener('DOMContentLoaded', async () => {
  poblarSelects();
  await cargarDatos();
  initNav();
  initTokenUI();
  renderDashboard();
  renderAll();

  document.getElementById('btnSalir')?.addEventListener('click', () => {
    sessionStorage.removeItem('adminOk');
    window.location.href = 'login.html';
  });
});

function poblarSelects() {
  const ids = ['pgMat', 'drMat', 'hMateria', 'exMat'];
  ids.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = MATERIAS.map(m => `<option value="${m}">${m}</option>`).join('');
  });
}

async function cargarDatos() {
  localStorage.removeItem(LS_KEY);
  try {
    const r = await fetch(`${RAW_URL}?_v=${Date.now()}`, { cache: 'no-store' });
    if (r.ok) D = await r.json();
  } catch(e) {
    console.warn('raw fetch falló:', e);
  }
  obtenerSHA();
  if (!D) D = datosVacios();
  if (!D.infoci) D.infoci = [];
}

async function obtenerSHA() {
  try {
    const token = localStorage.getItem(LS_TOKEN);
    const headers = token ? { Authorization: `token ${token}` } : {};
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`, { headers, cache: 'no-store' });
    if (r.ok) {
      const meta = await r.json();
      ghSHA = meta.sha;
    }
  } catch(e) {
    console.warn('obtenerSHA falló:', e);
  }
}

function guardarLocal() {}

function datosVacios() {
  return {
    noticias:[], horario:[], examenes:[], calendario:[],
    programas: MATERIAS.map(m => ({ materia: m, descripcion: 'Programa oficial · 2026', pdf: '' })),
    libros:[],
    drive: MATERIAS.map(m => ({ materia: m, descripcion: 'Carpeta del docente', url: '', urlClassroom: '' })),
    infoci: []
  };
}

async function publicarEnGitHub() {
  const token = localStorage.getItem(LS_TOKEN);
  if (!token) {
    toast('Configurá el token de GitHub primero (panel Publicar)', 'error');
    abrirPanel('publicar');
    return;
  }
  if (!ghSHA) {
    toast('Obteniendo SHA del archivo...', 'ok');
    await obtenerSHA();
  }
  const btn = document.getElementById('btnPublicar');
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i>Publicando...';
  btn.disabled = true;
  const contenido = btoa(unescape(encodeURIComponent(JSON.stringify(D, null, 2))));
  const body = {
    message: `[gestor] actualizar datos · ${new Date().toLocaleString('es-PY')}`,
    content: contenido,
    branch:  GH_BRANCH,
    ...(ghSHA ? { sha: ghSHA } : {})
  };
  try {
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json'
      },
      body: JSON.stringify(body)
    });
    if (r.ok) {
      const res = await r.json();
      ghSHA = res.content.sha;
      localStorage.removeItem(LS_KEY);
      toast('✅ Publicado en GitHub — el campus se actualizará en unos segundos');
      renderEstadoPublicacion('ok');
    } else {
      const err = await r.json();
      toast(`Error ${r.status}: ${err.message}`, 'error');
      if (r.status === 401) toast('Token inválido o expirado — verificá en Publicar', 'error');
    }
  } catch(e) {
    toast('Error de red al publicar', 'error');
  } finally {
    btn.innerHTML = orig;
    btn.disabled = false;
  }
}

function renderEstadoPublicacion(estado) {
  const el = document.getElementById('estadoPublicacion');
  if (!el) return;
  if (estado === 'ok') {
    el.innerHTML = `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Publicado · ${new Date().toLocaleTimeString('es-PY')}</span>`;
  } else {
    el.innerHTML = `<span class="badge bg-warning text-dark"><i class="bi bi-circle-fill me-1" style="font-size:.5rem"></i>Cambios sin publicar</span>`;
  }
}

function initTokenUI() {
  const saved = localStorage.getItem(LS_TOKEN);
  const inp = document.getElementById('ghToken');
  if (inp && saved) inp.value = saved;
  renderEstadoPublicacion('ok');
}

function guardarToken() {
  const t = document.getElementById('ghToken')?.value.trim();
  if (!t) { toast('Ingresá el token','error'); return; }
  localStorage.setItem(LS_TOKEN, t);
  toast('Token guardado — ya podés publicar');
}

function borrarToken() {
  if (!confirm('¿Eliminar el token guardado?')) return;
  localStorage.removeItem(LS_TOKEN);
  const inp = document.getElementById('ghToken');
  if (inp) inp.value = '';
  toast('Token eliminado');
}

function initNav() {
  document.querySelectorAll('.sb-link[data-panel]').forEach(el => {
    el.addEventListener('click', () => abrirPanel(el.dataset.panel));
  });
}

function abrirPanel(id) {
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.sb-link[data-panel="${id}"]`)?.classList.add('active');
  document.getElementById('panel-' + id)?.classList.add('active');
  if (id === 'exportar') A.mostrarJSON();
}

function toast(msg, tipo = 'ok') {
  const w = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast-item' + (tipo === 'error' ? ' error' : '');
  t.innerHTML = `<i class="bi ${tipo==='error'?'bi-x-circle':'bi-check-circle'}"></i>${msg}`;
  w.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function renderAll() {
  renderNoticias();
  renderHorarioGrid();
  renderExamenes();
  renderCalendario();
  renderProgramas();
  renderLibros();
  renderDrive();
  renderInfoCI();
}

function guardarLocalYMarcar() {
  guardarLocal();
  renderEstadoPublicacion('pendiente');
}

function renderDashboard() {
  const stats = [
    { label:'Noticias', val: D.noticias?.length||0, icon:'bi-megaphone-fill', color:'#1a237e', bg:'#e8eaf6' },
    { label:'Clases', val: D.horario?.length||0, icon:'bi-clock-fill', color:'#2e7d32', bg:'#e8f5e9' },
    { label:'Exámenes', val: D.examenes?.length||0, icon:'bi-journal-check', color:'#c62828', bg:'#ffebee' },
    { label:'Libros', val: D.libros?.length||0, icon:'bi-book-fill', color:'#e65100', bg:'#fff3e0' },
    { label:'Programas', val: D.programas?.filter(p=>p.pdf).length||0, icon:'bi-file-earmark-pdf-fill', color:'#4a148c', bg:'#f3e5f5' },
    { label:'Drive/Class', val: D.drive?.filter(d=>d.url||d.urlClassroom).length||0, icon:'bi-folder2-open', color:'#01579b', bg:'#e1f5fe' },
  ];
  const sr = document.getElementById('statsRow');
  if (sr) sr.innerHTML = stats.map(s => `<div class="col-6 col-md-4 col-lg-2"><div class="g-card"><div class="stat-icon mb-3" style="background:${s.bg};color:${s.color}"><i class="bi ${s.icon}"></i></div><div style="font-size:1.6rem;font-weight:800;color:${s.color}">${s.val}</div><div style="font-size:.78rem;color:#6b7280;font-weight:600">${s.label}</div></div></div>`).join('');
  renderDashboardPreviews();
}

function renderDashboardPreviews() {
  const empty = '<p style="color:#9ca3af;font-size:.82rem;font-style:italic;padding:8px 0">Sin datos cargados.</p>';
  const dn = document.getElementById('dash-noticias');
  if (dn) {
    if (!D.noticias?.length) dn.innerHTML = empty;
    else dn.innerHTML = `<table class="dash-tbl"><thead><tr><th>Título</th><th>Tipo</th><th>Fecha</th></tr></thead><tbody>${D.noticias.slice(0,5).map(n => `<tr><td><strong>${n.titulo}</strong>${n.urgente?' <span class="bt" style="background:#ffebee;color:#c62828">Urgente</span>':''}</td><td style="color:#6b7280">${n.tipo||'Aviso'}</td><td style="color:#6b7280">${n.fecha||'—'}</td></tr>`).join('')}</tbody></table>`;
  }
  const de = document.getElementById('dash-examenes');
  if (de) {
    if (!D.examenes?.length) de.innerHTML = empty;
    else de.innerHTML = `<table class="dash-tbl"><thead><tr><th>Materia</th><th>Tipo</th><th>Fecha / Hora</th></tr></thead><tbody>${D.examenes.slice(0,5).map(e => `<tr><td style="font-size:.78rem;font-weight:600">${e.materia}</td><td><span class="bt" style="background:#ffebee;color:#c62828">${e.tipo}</span></td><td style="color:#6b7280">${e.fecha} ${e.hora}</td></tr>`).join('')}</tbody></table>`;
  }
  const dh = document.getElementById('dash-horario');
  if (dh) {
    if (!D.horario?.length) dh.innerHTML = empty;
    else {
      const ORDEN = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
      const sorted = [...D.horario].sort((a,b) => ORDEN.indexOf(a.dia) - ORDEN.indexOf(b.dia) || a.hora.localeCompare(b.hora));
      dh.innerHTML = `<table class="dash-tbl"><thead><tr><th>Día</th><th>Hora</th><th>Materia</th><th>Profesor</th></tr></thead><tbody>${sorted.map(c => `<tr><td style="font-weight:600">${c.dia}</td><td>${c.hora}</td><td style="font-size:.78rem">${c.materia}</td><td style="color:#6b7280;font-size:.75rem">${c.profesor||'—'}</td></tr>`).join('')}</tbody></table>`;
    }
  }
  const dc = document.getElementById('dash-calendario');
  if (dc) {
    if (!D.calendario?.length) dc.innerHTML = empty;
    else {
      const col = {normal:'#3949ab', parcial:'#c62828', final:'#e65100'};
      dc.innerHTML = `<table class="dash-tbl"><thead><tr><th>Mes</th><th>Nombre</th><th>Fecha</th><th>Tipo</th></tr></thead><tbody>${D.calendario.map(p => `<tr><td>${p.mes}</td><td style="font-weight:600">${p.nombre}</td><td style="color:#6b7280">${p.fecha||'—'}</td><td><span class="bt" style="background:${col[p.tipo]||'#3949ab'};color:#fff">${p.tipo}</span></td></tr>`).join('')}</tbody></table>`;
    }
  }
  const dp = document.getElementById('dash-programas');
  if (dp) {
    if (!D.programas?.length) dp.innerHTML = empty;
    else dp.innerHTML = `<table class="dash-tbl"><thead><tr><th>Materia</th><th>PDF</th></tr></thead><tbody>${D.programas.map(p => `<tr><td style="font-size:.78rem">${p.materia}</td><td>${p.pdf ? `<a href="${p.pdf}" target="_blank" class="bt" style="background:#e8eaf6;color:#3949ab"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</a>` : '<span style="color:#9ca3af;font-size:.78rem">Sin PDF</span>'}</td></tr>`).join('')}</tbody></table>`;
  }
  const dl = document.getElementById('dash-libros');
  if (dl) {
    if (!D.libros?.length) dl.innerHTML = empty;
    else dl.innerHTML = `<table class="dash-tbl"><thead><tr><th>Materia</th><th>Título</th><th>Autor</th><th>PDF</th></tr></thead><tbody>${D.libros.slice(0,6).map(l => `<tr><td style="font-size:.78rem">${l.materia}</td><td style="font-weight:600">${l.titulo}</td><td style="color:#6b7280;font-size:.75rem">${l.autor||'—'}</td><td>${l.pdf ? `<a href="${l.pdf}" target="_blank" class="bt" style="background:#e8eaf6;color:#3949ab"><i class="bi bi-eye"></i></a>` : '—'}</td></tr>`).join('')}</tbody></table>`;
  }
  const dd = document.getElementById('dash-drive');
  if (dd) {
    if (!D.drive?.length) dd.innerHTML = empty;
    else dd.innerHTML = `<table class="dash-tbl"><thead><tr><th>Materia</th><th>Drive</th><th>Classroom</th></tr></thead><tbody>${D.drive.map(d => `<tr><td style="font-size:.8rem;font-weight:600">${d.materia}</td><td>${d.url ? `<a href="${d.url}" target="_blank" class="bt" style="background:#e3f2fd;color:#1565c0"><i class="bi bi-folder2-open me-1"></i>Drive</a>` : '<span style="color:#9ca3af;font-size:.78rem">—</span>'}</td><td>${d.urlClassroom ? `<a href="${d.urlClassroom}" target="_blank" class="bt" style="background:#e8f5e9;color:#2e7d32"><i class="bi bi-mortarboard me-1"></i>Classroom</a>` : '<span style="color:#9ca3af;font-size:.78rem">—</span>'}</td></tr>`).join('')}</tbody></table>`;
  }
}

function renderNoticias() {
  const c = document.getElementById('listaNoticiasAdmin'); if (!c) return;
  if (!D.noticias?.length) { c.innerHTML = '<p class="text-muted small">Sin noticias cargadas.</p>'; return; }
  c.innerHTML = `<div class="table-responsive"><table class="table tbl"><thead><tr><th>Título</th><th>Tipo</th><th>Fecha</th><th>Urgente</th><th></th></tr></thead><tbody>${D.noticias.map((n,i) => `<tr><td><strong>${n.titulo}</strong><br><small class="text-muted">${n.descripcion||''}</small></td><td><span class="bt" style="background:#e8eaf6;color:#3949ab">${n.tipo||'Aviso'}</span></td><td>${n.fecha||'—'}</td><td>${n.urgente?'<span class="bt" style="background:#ffebee;color:#c62828">Sí</span>':'<span class="text-muted small">No</span>'}</td><td><button class="btn-peligro" onclick="A.eliminarNoticia(${i})"><i class="bi bi-trash"></i></button></td></tr>`).join('')}</tbody></table></div>`;
}

const A = {
  agregarNoticia() { const tit = v('noTit'); if (!tit) { toast('El título es obligatorio','error'); return; } D.noticias.unshift({ titulo:tit, descripcion:v('noDesc'), tipo:v('noTipo')||'Aviso', fecha:v('noFecha'), urgente:document.getElementById('noUrgente').checked }); guardarLocalYMarcar(); renderNoticias(); renderDashboard(); clear('noTit','noDesc','noTipo','noFecha'); document.getElementById('noUrgente').checked = false; toast('Noticia agregada'); },
  eliminarNoticia(i) { if (!confirm('¿Eliminar esta noticia?')) return; D.noticias.splice(i,1); guardarLocalYMarcar(); renderNoticias(); renderDashboard(); toast('Noticia eliminada'); },
  agregarHorario() { const dia=v('hDia'), hora=v('hHora'), mat=v('hMateria'), prof=v('hProf'); if (!hora) { toast('Ingresá la hora','error'); return; } if (D.horario.find(c=>c.dia===dia&&c.hora===hora)) { toast(`Ya hay clase los ${dia} a las ${hora}`,'error'); return; } D.horario.push({ dia, hora, materia:mat, profesor:prof }); D.horario.sort((a,b)=>a.hora.localeCompare(b.hora)); guardarLocalYMarcar(); renderHorarioGrid(); renderDashboard(); toast('Clase agregada'); },
  eliminarClase(dia, hora) { D.horario = D.horario.filter(c=>!(c.dia===dia&&c.hora===hora)); guardarLocalYMarcar(); renderHorarioGrid(); renderDashboard(); toast('Clase eliminada'); },
  agregarExamen() { const mat=v('exMat'),tipo=v('exTipo'),fecha=v('exFecha'),hora=v('exHora'),aula=v('exAula'),prof=v('exProf'); if (!fecha||!hora) { toast('Fecha y hora son obligatorias','error'); return; } D.examenes.push({ materia:mat, tipo, fecha, hora, aula, profesor:prof }); guardarLocalYMarcar(); renderExamenes(); renderDashboard(); clear('exFecha','exHora','exAula','exProf'); toast('Exámen agregado'); },
  eliminarExamen(i) { if (!confirm('¿Eliminar este exámen?')) return; D.examenes.splice(i,1); guardarLocalYMarcar(); renderExamenes(); renderDashboard(); toast('Exámen eliminado'); },
  agregarCalendario() { const mes=v('calMes'), nom=v('calNom'), fecha=v('calFecha'), tipo=v('calTipo'); if (!mes||!nom) { toast('Mes y nombre son obligatorios','error'); return; } D.calendario.push({ mes, nombre:nom, fecha, tipo }); guardarLocalYMarcar(); renderCalendario(); clear('calMes','calNom','calFecha'); toast('Período agregado'); },
  eliminarCalendario(i) { if (!confirm('¿Eliminar este período?')) return; D.calendario.splice(i,1); guardarLocalYMarcar(); renderCalendario(); toast('Período eliminado'); },
  guardarPrograma() { const mat=v('pgMat'); const pdf=v('pgUrl'); const desc=v('pgDesc'); if (!mat) { toast('Seleccióná una materia','error'); return; } const idx=D.programas.findIndex(p=>p.materia===mat); if (idx>=0) { D.programas[idx].pdf=pdf; if (desc) D.programas[idx].descripcion=desc; } else { D.programas.push({ materia:mat, descripcion:desc || 'Programa oficial · 2026', pdf }); } guardarLocalYMarcar(); renderProgramas(); renderDashboard(); clear('pgUrl','pgDesc'); document.getElementById('pgMat').value = mat; toast('Programa guardado'); },
  eliminarPrograma(i) { if (!confirm('¿Eliminar el programa de esta materia?')) return; D.programas.splice(i, 1); guardarLocalYMarcar(); renderProgramas(); renderDashboard(); toast('Programa eliminado'); },
  agregarLibro() { const mat=v('lbMat'), tit=v('lbTit'), aut=v('lbAut'); if (!mat||!tit) { toast('Materia y título son obligatorios','error'); return; } D.libros.push({ materia:mat, titulo:tit, autor:aut, pdf:v('lbPdf'), imagen:v('lbImg') }); guardarLocalYMarcar(); renderLibros(); renderDashboard(); clear('lbMat','lbTit','lbAut','lbPdf','lbImg'); toast('Libro agregado'); },
  eliminarLibro(i) { if (!confirm('¿Eliminar este libro?')) return; D.libros.splice(i,1); guardarLocalYMarcar(); renderLibros(); renderDashboard(); toast('Libro eliminado'); },
  guardarDrive() { const mat=v('drMat'); const url=v('drUrl'); const cls=v('drClassroom'); const desc=v('drDesc'); if (!mat) { toast('Seleccióná una materia','error'); return; } const idx=D.drive.findIndex(d=>d.materia===mat); if (idx>=0) { D.drive[idx].url=url; D.drive[idx].urlClassroom=cls; if (desc) D.drive[idx].descripcion=desc; } else { D.drive.push({ materia:mat, descripcion:desc || 'Carpeta del docente', url, urlClassroom: cls }); } guardarLocalYMarcar(); renderDrive(); renderDashboard(); clear('drUrl','drClassroom','drDesc'); document.getElementById('drMat').value = mat; toast('Links guardados'); },
  eliminarDrive(i) { if (!confirm('¿Eliminar los links de Drive/Classroom de esta materia?')) return; D.drive.splice(i, 1); guardarLocalYMarcar(); renderDrive(); renderDashboard(); toast('Entrada de Drive eliminada'); },
  importarCsvCI() { const raw = document.getElementById('ciCsvInput')?.value.trim(); if (!raw) { toast('Pegá filas en formato CI,mensaje','error'); return; } let agregados = 0; raw.split('\n').forEach(line => { const comma = line.indexOf(','); if (comma === -1) return; const ci = line.slice(0, comma).trim(); const msg = line.slice(comma + 1).trim(); if (!ci || !msg) return; const idx = D.infoci.findIndex(r => String(r.ci) === ci); if (idx >= 0) D.infoci[idx].mensaje = msg; else D.infoci.push({ ci, mensaje: msg }); agregados++; }); if (!agregados) { toast('No se encontraron filas válidas','error'); return; } document.getElementById('ciCsvInput').value = ''; guardarLocalYMarcar(); renderInfoCI(); toast(`${agregados} registro(s) importado(s)`); },
  agregarRegistroCI() { const ci = document.getElementById('ciNuevoCI')?.value.trim(); const msg = document.getElementById('ciNuevoMsg')?.value.trim(); if (!ci || !msg) { toast('Completá CI y mensaje','error'); return; } const idx = D.infoci.findIndex(r => String(r.ci) === ci); if (idx >= 0) { D.infoci[idx].mensaje = msg; toast('Registro actualizado'); } else { D.infoci.push({ ci, mensaje: msg }); toast('Registro agregado'); } clear('ciNuevoCI','ciNuevoMsg'); guardarLocalYMarcar(); renderInfoCI(); },
  eliminarRegistroCI(i) { if (!confirm('¿Eliminar este registro?')) return; D.infoci.splice(i, 1); guardarLocalYMarcar(); renderInfoCI(); toast('Registro eliminado'); },
  limpiarInfoCI() { if (!confirm('¿Eliminar TODOS los registros de CI?')) return; D.infoci = []; guardarLocalYMarcar(); renderInfoCI(); toast('Lista de CI limpiada'); },
  mostrarJSON() { document.getElementById('jsonOutput').textContent = JSON.stringify(D, null, 2); },
  exportarJSON() { const json = JSON.stringify(D, null, 2); document.getElementById('jsonOutput').textContent = json; navigator.clipboard?.writeText(json).then(()=>toast('JSON copiado al portapapeles')).catch(()=>toast('Copiá el texto manualmente','error')); },
  descargarJSON() { const blob = new Blob([JSON.stringify(D,null,2)],{type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '2do.json'; a.click(); toast('Archivo descargado'); },
  resetearDatos() { if (!confirm('¿Resetar al último JSON publicado en GitHub? Se perderán los cambios locales.')) return; localStorage.removeItem(LS_KEY); location.reload(); }
};

function renderHorarioGrid() {
  const grid = document.getElementById('horarioGrid'); if (!grid) return;
  const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
  const horas = [...new Set(D.horario.map(c=>c.hora))]; ['18:00','19:00','20:00','21:00'].forEach(h=>{if(!horas.includes(h)) horas.push(h);}); horas.sort();
  let html = '<div class="hg-head" style="grid-column:1">Hora</div>'; DIAS.forEach(d=>html+=`<div class="hg-head">${d}</div>`);
  horas.forEach(h=>{ html+=`<div class="hg-hora">${h}</div>`; DIAS.forEach(dia=>{ const cls=D.horario.find(c=>c.dia===dia&&c.hora===h); html += cls ? `<div class="hg-cell ocupada" onclick="A.eliminarClase('${dia}','${h}')"><div class="hg-mat">${cls.materia.split(' ').slice(0,2).join(' ')}</div><div class="hg-prof">${cls.profesor||''}</div><div class="hg-del"><i class="bi bi-x-circle"></i> Quitar</div></div>` : `<div class="hg-cell" onclick="prefillHorario('${dia}','${h}')"><i class="bi bi-plus text-muted"></i></div>`; }); });
  grid.innerHTML = html;
}

function prefillHorario(dia, hora) { document.getElementById('hDia').value = dia; document.getElementById('hHora').value = hora; document.getElementById('hProf')?.focus(); }
function renderExamenes() { const tb=document.querySelector('#tablaExamenesAdmin tbody'); if(!tb) return; tb.innerHTML = D.examenes?.length ? D.examenes.map((e,i)=>`<tr><td>${e.materia}</td><td>${e.tipo}</td><td>${e.fecha}</td><td>${e.hora}</td><td>${e.aula||'—'}</td><td>${e.profesor||'—'}</td><td><button class="btn-peligro" onclick="A.eliminarExamen(${i})"><i class="bi bi-trash"></i></button></td></tr>`).join('') : '<tr><td colspan="7" class="text-muted text-center small">Sin exámenes</td></tr>'; }
function renderCalendario() { const tb=document.querySelector('#tablaCalendarioAdmin tbody'); if(!tb) return; const col={normal:'#3949ab',parcial:'#c62828',final:'#e65100'}; tb.innerHTML = D.calendario?.length ? D.calendario.map((p,i)=>`<tr><td>${p.mes}</td><td>${p.nombre}</td><td>${p.fecha||'—'}</td><td><span class="bt" style="background:${col[p.tipo]||'#3949ab'};color:#fff">${p.tipo}</span></td><td><button class="btn-peligro" onclick="A.eliminarCalendario(${i})"><i class="bi bi-trash"></i></button></td></tr>`).join('') : '<tr><td colspan="5" class="text-muted text-center small">Sin períodos</td></tr>'; }
function renderProgramas() { const tb=document.querySelector('#tablaProgramasAdmin tbody'); if(!tb) return; tb.innerHTML = D.programas?.map((p,i)=>`<tr><td>${p.materia}</td><td class="text-muted small">${p.descripcion||''}</td><td>${p.pdf ? `<a href="${p.pdf}" target="_blank" class="btn btn-sm btn-outline-primary py-0"><i class="bi bi-eye me-1"></i>Ver</a>` : '<span class="text-muted small">Sin URL</span>'}</td><td><button class="btn-edit" onclick="editarPrograma(${i})"><i class="bi bi-pencil"></i> Editar</button></td><td><button class="btn-peligro" onclick="A.eliminarPrograma(${i})"><i class="bi bi-trash"></i></button></td></tr>`).join('') || '<tr><td colspan="5" class="text-muted text-center small">Sin programas</td></tr>'; }
function editarPrograma(i) { const p = D.programas[i]; document.getElementById('pgMat').value = p.materia; document.getElementById('pgDesc').value = p.descripcion || ''; document.getElementById('pgUrl').value = p.pdf || ''; document.getElementById('pgUrl').scrollIntoView({ behavior:'smooth', block:'center' }); document.getElementById('pgUrl').focus(); }
function renderLibros() { const tb=document.querySelector('#tablaLibrosAdmin tbody'); if(!tb) return; tb.innerHTML = D.libros?.length ? D.libros.map((l,i)=>`<tr><td class="small">${l.materia}</td><td><strong>${l.titulo}</strong></td><td class="small">${l.autor||'—'}</td><td>${l.pdf ? `<a href="${l.pdf}" target="_blank" class="btn btn-sm btn-outline-primary py-0"><i class="bi bi-eye"></i></a>` : '—'}</td><td><button class="btn-peligro" onclick="A.eliminarLibro(${i})"><i class="bi bi-trash"></i></button></td></tr>`).join('') : '<tr><td colspan="5" class="text-muted text-center small">Sin libros</td></tr>'; }
function renderDrive() { const tb=document.querySelector('#tablaDriveAdmin tbody'); if(!tb) return; tb.innerHTML = D.drive?.map((d,i)=>`<tr><td class="small fw-semibold">${d.materia}</td><td>${d.url ? `<a href="${d.url}" target="_blank" class="btn btn-sm btn-outline-primary py-0"><i class="bi bi-folder2-open me-1"></i>Drive</a>` : '<span class="text-muted small">Sin link</span>'}</td><td>${d.urlClassroom ? `<a href="${d.urlClassroom}" target="_blank" class="btn btn-sm btn-outline-success py-0"><i class="bi bi-mortarboard me-1"></i>Classroom</a>` : '<span class="text-muted small">Sin link</span>'}</td><td><button class="btn-edit" onclick="editarDrive(${i})"><i class="bi bi-pencil"></i> Editar</button></td><td><button class="btn-peligro" onclick="A.eliminarDrive(${i})"><i class="bi bi-trash"></i></button></td></tr>`).join('') || '<tr><td colspan="5" class="text-muted text-center small">Sin datos</td></tr>'; }
function editarDrive(i) { const d = D.drive[i]; document.getElementById('drMat').value = d.materia; document.getElementById('drUrl').value = d.url || ''; document.getElementById('drClassroom').value = d.urlClassroom || ''; document.getElementById('drDesc').value = d.descripcion || ''; document.getElementById('drUrl').scrollIntoView({ behavior:'smooth', block:'center' }); document.getElementById('drUrl').focus(); }
function renderInfoCI() { const tb = document.querySelector('#tablaCIAdmin tbody'); const count = document.getElementById('ciCount'); if (!tb) return; const lista = D.infoci || []; if (count) count.textContent = lista.length; tb.innerHTML = lista.length ? lista.map((r,i) => `<tr><td class="font-monospace">${r.ci}</td><td class="small">${r.mensaje}</td><td><button class="btn-peligro" onclick="A.eliminarRegistroCI(${i})"><i class="bi bi-trash"></i></button></td></tr>`).join('') : '<tr><td colspan="3" class="text-muted text-center small">Sin registros cargados.</td></tr>'; }
function v(id){ return document.getElementById(id)?.value.trim()||''; }
function clear(...ids){ ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; }); }
