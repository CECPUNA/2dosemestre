/* ===================================================
   Gestor de Contenidos · 2do Semestre
   admin.js — CRUD + localStorage + GitHub API publish
   =================================================== */

const DATA_URL  = '../data/2do.json';
const LS_KEY    = 'cms_2do_2026';
const GH_REPO   = 'sentiege/horariocentro';   // owner/repo
const GH_PATH   = 'data/2do.json';            // ruta del archivo en el repo
const GH_BRANCH = 'main';
const LS_TOKEN  = 'gh_token_cms';             // clave localStorage para el token

let D    = null;  // datos en memoria
let ghSHA = null; // SHA actual del archivo (necesario para el PUT)

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await cargarDatos();
  initNav();
  initTokenUI();
  renderDashboard();
  renderAll();

  document.getElementById('btnSalir')?.addEventListener('click', () => {
    localStorage.removeItem('admin_auth');
    window.location.href = 'login.html';
  });
});

// =====================
// CARGA DE DATOS
// =====================
async function cargarDatos() {
  // 1. Intentar cargar desde localStorage (cambios no publicados)
  const guardado = localStorage.getItem(LS_KEY);
  if (guardado) {
    try { D = JSON.parse(guardado); } catch(e) { D = null; }
  }

  // 2. Siempre obtener el SHA actual del archivo en GitHub (para poder hacer PUT)
  try {
    const token = localStorage.getItem(LS_TOKEN);
    const headers = token ? { Authorization: `token ${token}` } : {};
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`, { headers });
    if (r.ok) {
      const meta = await r.json();
      ghSHA = meta.sha;
      // Si no hay datos locales, usar los del repo (decodificar base64)
      if (!D) {
        const raw = atob(meta.content.replace(/\n/g,''));
        D = JSON.parse(raw);
      }
    }
  } catch(e) {}

  if (!D) D = datosVacios();
}

function guardarLocal() {
  localStorage.setItem(LS_KEY, JSON.stringify(D));
}

function datosVacios() {
  return {
    noticias:[], horario:[], examenes:[], calendario:[],
    programas:[
      {materia:'Economía Política', descripcion:'Programa oficial · 2026', pdf:''},
      {materia:'Introducción a las Ciencias Políticas', descripcion:'Programa oficial · 2026', pdf:''},
      {materia:'Historia Política Paraguaya', descripcion:'Programa oficial · 2026', pdf:''},
      {materia:'Idioma Guaraní II', descripcion:'Programa oficial · 2026', pdf:''},
      {materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', descripcion:'Programa oficial · 2026', pdf:''}
    ],
    libros:[],
    drive:[
      {materia:'Economía Política', descripcion:'Carpeta del docente', url:'', urlClassroom:''},
      {materia:'Introducción a las Ciencias Políticas', descripcion:'Carpeta del docente', url:'', urlClassroom:''},
      {materia:'Historia Política Paraguaya', descripcion:'Carpeta del docente', url:'', urlClassroom:''},
      {materia:'Idioma Guaraní II', descripcion:'Carpeta del docente', url:'', urlClassroom:''},
      {materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', descripcion:'Carpeta del docente', url:'', urlClassroom:''}
    ]
  };
}

// =====================
// GITHUB API PUBLISH
// =====================
async function publicarEnGitHub() {
  const token = localStorage.getItem(LS_TOKEN);
  if (!token) {
    toast('Configurá el token de GitHub primero (panel Publicar)', 'error');
    abrirPanel('publicar');
    return;
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
      ghSHA = res.content.sha; // actualizar SHA para el próximo PUT
      localStorage.removeItem(LS_KEY); // limpiar borrador local
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

// =====================
// TOKEN UI
// =====================
function initTokenUI() {
  const saved = localStorage.getItem(LS_TOKEN);
  const inp = document.getElementById('ghToken');
  if (inp && saved) inp.value = saved;

  // Estado inicial
  renderEstadoPublicacion(saved ? 'pendiente' : 'sin-token');
}

function guardarToken() {
  const t = document.getElementById('ghToken')?.value.trim();
  if (!t) { toast('Ingresá el token','error'); return; }
  localStorage.setItem(LS_TOKEN, t);
  toast('Token guardado — ya podés publicar');
  renderEstadoPublicacion('pendiente');
}

function borrarToken() {
  if (!confirm('¿Eliminar el token guardado?')) return;
  localStorage.removeItem(LS_TOKEN);
  const inp = document.getElementById('ghToken');
  if (inp) inp.value = '';
  toast('Token eliminado');
}

// =====================
// NAV
// =====================
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

// =====================
// TOAST
// =====================
function toast(msg, tipo = 'ok') {
  const w = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast-item' + (tipo === 'error' ? ' error' : '');
  t.innerHTML = `<i class="bi ${tipo==='error'?'bi-x-circle':'bi-check-circle'}"></i>${msg}`;
  w.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// =====================
// RENDER ALL
// =====================
function renderAll() {
  renderNoticias();
  renderHorarioGrid();
  renderExamenes();
  renderCalendario();
  renderProgramas();
  renderLibros();
  renderDrive();
}

// Marcar que hay cambios sin publicar
function guardarLocalYMarcar() {
  guardarLocal();
  renderEstadoPublicacion('pendiente');
}

// =====================
// DASHBOARD STATS
// =====================
function renderDashboard() {
  const stats = [
    { label:'Noticias',  val: D.noticias?.length||0,  icon:'bi-megaphone-fill',       color:'#1a237e', bg:'#e8eaf6' },
    { label:'Clases',    val: D.horario?.length||0,   icon:'bi-clock-fill',           color:'#2e7d32', bg:'#e8f5e9' },
    { label:'Exámenes',  val: D.examenes?.length||0,  icon:'bi-journal-check',        color:'#c62828', bg:'#ffebee' },
    { label:'Libros',    val: D.libros?.length||0,    icon:'bi-book-fill',            color:'#e65100', bg:'#fff3e0' },
    { label:'Programas', val: D.programas?.filter(p=>p.pdf).length||0, icon:'bi-file-earmark-pdf-fill', color:'#4a148c', bg:'#f3e5f5' },
    { label:'Drive/Class',val: D.drive?.filter(d=>d.url||d.urlClassroom).length||0, icon:'bi-folder2-open', color:'#01579b', bg:'#e1f5fe' },
  ];
  document.getElementById('statsRow').innerHTML = stats.map(s => `
    <div class="col-6 col-md-4 col-lg-2">
      <div class="g-card">
        <div class="stat-icon mb-3" style="background:${s.bg};color:${s.color}"><i class="bi ${s.icon}"></i></div>
        <div style="font-size:1.6rem;font-weight:800;color:${s.color}">${s.val}</div>
        <div style="font-size:.78rem;color:#6b7280;font-weight:600">${s.label}</div>
      </div>
    </div>`).join('');
}

// =====================
// NOTICIAS
// =====================
function renderNoticias() {
  const c = document.getElementById('listaNoticiasAdmin');
  if (!c) return;
  if (!D.noticias?.length) { c.innerHTML = '<p class="text-muted small">Sin noticias cargadas.</p>'; return; }
  c.innerHTML = `<div class="table-responsive"><table class="table tbl"><thead><tr>
    <th>Título</th><th>Tipo</th><th>Fecha</th><th>Urgente</th><th></th></tr></thead><tbody>`+
    D.noticias.map((n,i) => `<tr>
      <td><strong>${n.titulo}</strong><br><small class="text-muted">${n.descripcion||''}</small></td>
      <td><span class="bt" style="background:#e8eaf6;color:#3949ab">${n.tipo||'Aviso'}</span></td>
      <td>${n.fecha||'—'}</td>
      <td>${n.urgente?'<span class="bt" style="background:#ffebee;color:#c62828">Sí</span>':'<span class="text-muted small">No</span>'}</td>
      <td><button class="btn-peligro" onclick="A.eliminarNoticia(${i})"><i class="bi bi-trash"></i></button></td>
    </tr>`).join('') + '</tbody></table></div>';
}

const A = {

  agregarNoticia() {
    const tit = v('noTit'); if (!tit) { toast('El título es obligatorio','error'); return; }
    D.noticias.unshift({ titulo:tit, descripcion:v('noDesc'), tipo:v('noTipo')||'Aviso', fecha:v('noFecha'), urgente:document.getElementById('noUrgente').checked });
    guardarLocalYMarcar(); renderNoticias(); renderDashboard();
    clear('noTit','noDesc','noTipo','noFecha'); document.getElementById('noUrgente').checked=false;
    toast('Noticia agregada');
  },

  eliminarNoticia(i) {
    if (!confirm('¿Eliminar esta noticia?')) return;
    D.noticias.splice(i,1); guardarLocalYMarcar(); renderNoticias(); renderDashboard(); toast('Noticia eliminada');
  },

  agregarHorario() {
    const dia=v('hDia'), hora=v('hHora'), mat=v('hMateria'), prof=v('hProf');
    if (!hora) { toast('Ingresá la hora','error'); return; }
    if (D.horario.find(c=>c.dia===dia&&c.hora===hora)) { toast(`Ya hay clase los ${dia} a las ${hora}`,'error'); return; }
    D.horario.push({ dia, hora, materia:mat, profesor:prof });
    D.horario.sort((a,b)=>a.hora.localeCompare(b.hora));
    guardarLocalYMarcar(); renderHorarioGrid(); renderDashboard(); toast('Clase agregada');
  },

  eliminarClase(dia, hora) {
    D.horario = D.horario.filter(c=>!(c.dia===dia&&c.hora===hora));
    guardarLocalYMarcar(); renderHorarioGrid(); renderDashboard(); toast('Clase eliminada');
  },

  agregarExamen() {
    const mat=v('exMat'),tipo=v('exTipo'),fecha=v('exFecha'),hora=v('exHora'),aula=v('exAula'),prof=v('exProf');
    if (!fecha||!hora) { toast('Fecha y hora son obligatorias','error'); return; }
    D.examenes.push({ materia:mat, tipo, fecha, hora, aula, profesor:prof });
    guardarLocalYMarcar(); renderExamenes(); renderDashboard(); clear('exFecha','exHora','exAula','exProf'); toast('Exámen agregado');
  },

  eliminarExamen(i) {
    if (!confirm('¿Eliminar este exámen?')) return;
    D.examenes.splice(i,1); guardarLocalYMarcar(); renderExamenes(); renderDashboard(); toast('Exámen eliminado');
  },

  agregarCalendario() {
    const mes=v('calMes'),nom=v('calNom'),fecha=v('calFecha'),tipo=v('calTipo');
    if (!mes||!nom) { toast('Mes y nombre son obligatorios','error'); return; }
    D.calendario.push({ mes, nombre:nom, fecha, tipo });
    guardarLocalYMarcar(); renderCalendario(); clear('calMes','calNom','calFecha'); toast('Período agregado');
  },

  eliminarCalendario(i) {
    if (!confirm('¿Eliminar este período?')) return;
    D.calendario.splice(i,1); guardarLocalYMarcar(); renderCalendario(); toast('Período eliminado');
  },

  guardarPrograma() {
    const mat=v('pgMat'),pdf=v('pgUrl'),desc=v('pgDesc');
    const idx=D.programas.findIndex(p=>p.materia===mat);
    if (idx>=0) { D.programas[idx].pdf=pdf; if(desc) D.programas[idx].descripcion=desc; }
    else D.programas.push({ materia:mat, descripcion:desc||'Programa oficial · 2026', pdf });
    guardarLocalYMarcar(); renderProgramas(); renderDashboard(); clear('pgUrl','pgDesc'); toast('Programa guardado');
  },

  agregarLibro() {
    const mat=v('lbMat'),tit=v('lbTit'),aut=v('lbAut');
    if (!mat||!tit) { toast('Materia y título son obligatorios','error'); return; }
    D.libros.push({ materia:mat, titulo:tit, autor:aut, pdf:v('lbPdf'), imagen:v('lbImg') });
    guardarLocalYMarcar(); renderLibros(); renderDashboard(); clear('lbMat','lbTit','lbAut','lbPdf','lbImg'); toast('Libro agregado');
  },

  eliminarLibro(i) {
    if (!confirm('¿Eliminar este libro?')) return;
    D.libros.splice(i,1); guardarLocalYMarcar(); renderLibros(); renderDashboard(); toast('Libro eliminado');
  },

  guardarDrive() {
    const mat=v('drMat'),url=v('drUrl'),cls=v('drClassroom'),desc=v('drDesc');
    const idx=D.drive.findIndex(d=>d.materia===mat);
    if (idx>=0) { D.drive[idx].url=url; D.drive[idx].urlClassroom=cls; if(desc) D.drive[idx].descripcion=desc; }
    else D.drive.push({ materia:mat, descripcion:desc||'Carpeta del docente', url, urlClassroom:cls });
    guardarLocalYMarcar(); renderDrive(); renderDashboard(); clear('drUrl','drClassroom','drDesc'); toast('Links guardados');
  },

  mostrarJSON() {
    document.getElementById('jsonOutput').textContent = JSON.stringify(D, null, 2);
  },

  exportarJSON() {
    const json = JSON.stringify(D, null, 2);
    document.getElementById('jsonOutput').textContent = json;
    navigator.clipboard?.writeText(json)
      .then(()=>toast('JSON copiado al portapapeles'))
      .catch(()=>toast('Copiá el texto manualmente','error'));
  },

  descargarJSON() {
    const blob = new Blob([JSON.stringify(D,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '2do.json'; a.click();
    toast('Archivo descargado');
  },

  resetearDatos() {
    if (!confirm('¿Resetar al último JSON publicado en GitHub? Se perderán los cambios locales.')) return;
    localStorage.removeItem(LS_KEY);
    location.reload();
  }
};

// =====================
// RENDERS INTERNOS
// =====================
function renderHorarioGrid() {
  const grid = document.getElementById('horarioGrid');
  if (!grid) return;
  const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
  const horas = [...new Set(D.horario.map(c=>c.hora))];
  ['18:00','19:00','20:00','21:00'].forEach(h=>{if(!horas.includes(h)) horas.push(h);});
  horas.sort();

  let html = '<div class="hg-head" style="grid-column:1">Hora</div>';
  DIAS.forEach(d=>html+=`<div class="hg-head">${d}</div>`);
  horas.forEach(h=>{
    html+=`<div class="hg-hora">${h}</div>`;
    DIAS.forEach(dia=>{
      const cls=D.horario.find(c=>c.dia===dia&&c.hora===h);
      html += cls
        ? `<div class="hg-cell ocupada" onclick="A.eliminarClase('${dia}','${h}')">
             <div class="hg-mat">${cls.materia.split(' ').slice(0,2).join(' ')}</div>
             <div class="hg-prof">${cls.profesor||''}</div>
             <div class="hg-del"><i class="bi bi-x-circle"></i> Quitar</div>
           </div>`
        : `<div class="hg-cell" onclick="prefillHorario('${dia}','${h}')"><i class="bi bi-plus text-muted"></i></div>`;
    });
  });
  grid.innerHTML = html;
}

function prefillHorario(dia, hora) {
  document.getElementById('hDia').value = dia;
  document.getElementById('hHora').value = hora;
  document.getElementById('hProf')?.focus();
}

function renderExamenes() {
  const tb=document.querySelector('#tablaExamenesAdmin tbody'); if(!tb) return;
  tb.innerHTML = D.examenes?.length ? D.examenes.map((e,i)=>`<tr>
    <td>${e.materia}</td><td>${e.tipo}</td><td>${e.fecha}</td><td>${e.hora}</td>
    <td>${e.aula||'—'}</td><td>${e.profesor||'—'}</td>
    <td><button class="btn-peligro" onclick="A.eliminarExamen(${i})"><i class="bi bi-trash"></i></button></td>
  </tr>`).join('') : '<tr><td colspan="7" class="text-muted text-center small">Sin exámenes</td></tr>';
}

function renderCalendario() {
  const tb=document.querySelector('#tablaCalendarioAdmin tbody'); if(!tb) return;
  const col={normal:'#3949ab',parcial:'#c62828',final:'#e65100'};
  tb.innerHTML = D.calendario?.length ? D.calendario.map((p,i)=>`<tr>
    <td>${p.mes}</td><td>${p.nombre}</td><td>${p.fecha||'—'}</td>
    <td><span class="bt" style="background:${col[p.tipo]||'#3949ab'};color:#fff">${p.tipo}</span></td>
    <td><button class="btn-peligro" onclick="A.eliminarCalendario(${i})"><i class="bi bi-trash"></i></button></td>
  </tr>`).join('') : '<tr><td colspan="5" class="text-muted text-center small">Sin períodos</td></tr>';
}

function renderProgramas() {
  const tb=document.querySelector('#tablaProgramasAdmin tbody'); if(!tb) return;
  tb.innerHTML = D.programas?.map((p,i)=>`<tr>
    <td>${p.materia}</td>
    <td class="text-muted small">${p.descripcion||''}</td>
    <td>${p.pdf?`<a href="${p.pdf}" target="_blank" class="btn btn-sm btn-outline-primary py-0"><i class="bi bi-eye me-1"></i>Ver</a>`:'<span class="text-muted small">Sin URL</span>'}</td>
    <td><button class="btn-edit" onclick="editarPrograma(${i})"><i class="bi bi-pencil"></i></button></td>
  </tr>`).join('') || '<tr><td colspan="4" class="text-muted text-center small">Sin programas</td></tr>';
}

function editarPrograma(i) {
  const p=D.programas[i];
  document.getElementById('pgMat').value=p.materia;
  document.getElementById('pgDesc').value=p.descripcion||'';
  document.getElementById('pgUrl').value=p.pdf||'';
}

function renderLibros() {
  const tb=document.querySelector('#tablaLibrosAdmin tbody'); if(!tb) return;
  tb.innerHTML = D.libros?.length ? D.libros.map((l,i)=>`<tr>
    <td class="small">${l.materia}</td>
    <td><strong>${l.titulo}</strong></td>
    <td class="small">${l.autor||'—'}</td>
    <td>${l.pdf?`<a href="${l.pdf}" target="_blank" class="btn btn-sm btn-outline-primary py-0"><i class="bi bi-eye"></i></a>`:'—'}</td>
    <td><button class="btn-peligro" onclick="A.eliminarLibro(${i})"><i class="bi bi-trash"></i></button></td>
  </tr>`).join('') : '<tr><td colspan="5" class="text-muted text-center small">Sin libros</td></tr>';
}

function renderDrive() {
  const tb=document.querySelector('#tablaDriveAdmin tbody'); if(!tb) return;
  tb.innerHTML = D.drive?.map((d,i)=>`<tr>
    <td class="small fw-semibold">${d.materia}</td>
    <td>${d.url?`<a href="${d.url}" target="_blank" class="btn btn-sm btn-outline-primary py-0"><i class="bi bi-folder2-open me-1"></i>Drive</a>`:'<span class="text-muted small">Sin link</span>'}</td>
    <td>${d.urlClassroom?`<a href="${d.urlClassroom}" target="_blank" class="btn btn-sm btn-outline-success py-0"><i class="bi bi-mortarboard me-1"></i>Classroom</a>`:'<span class="text-muted small">Sin link</span>'}</td>
    <td><button class="btn-edit" onclick="editarDrive(${i})"><i class="bi bi-pencil"></i></button></td>
  </tr>`).join('') || '<tr><td colspan="4" class="text-muted text-center small">Sin datos</td></tr>';
}

function editarDrive(i) {
  const d=D.drive[i];
  document.getElementById('drMat').value=d.materia;
  document.getElementById('drUrl').value=d.url||'';
  document.getElementById('drClassroom').value=d.urlClassroom||'';
  document.getElementById('drDesc').value=d.descripcion||'';
}

// ===== HELPERS =====
function v(id){ return document.getElementById(id)?.value.trim()||''; }
function clear(...ids){ ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; }); }
