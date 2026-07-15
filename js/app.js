/* ===================================================
   Campus Informativo · 2do Semestre · app.js
   =================================================== */

const DATA_URL = 'data/2do.json';
let DATA = null;

const COLORES_MATERIAS = {
  'Economía Política': 'color-econopolitica',
  'Introducción a las Ciencias Políticas': 'color-introccp',
  'Historia Política Paraguaya': 'color-historiapolit',
  'Idioma Guaraní II': 'color-guarani',
  'Seminario II': 'color-seminario'
};

function colorMateria(nombre) {
  if (!nombre) return 'color-econopolitica';
  for (const [key, cls] of Object.entries(COLORES_MATERIAS)) {
    if (nombre.startsWith(key)) return cls;
  }
  return 'color-econopolitica';
}

// ===== FETCH DATA =====
async function cargarDatos() {
  try {
    const resp = await fetch(DATA_URL);
    DATA = await resp.json();
  } catch (e) {
    DATA = datosDemo();
  }
  renderAll();
}

function renderAll() {
  verificarClaseActiva(); // primero, para que el banner aparezca antes de la tabla
  renderHorario();
  renderNoticias();
  renderExamenes();
  renderParciales();
  renderProgramas();
  renderLibros();
  renderDrive();
  initTema();
}

// ===== NOTICIAS =====
function renderNoticias() {
  const c = document.getElementById('noticiasContainer');
  if (!c) return;
  if (!DATA.noticias?.length) { c.innerHTML = '<p class="text-muted">Sin avisos por el momento.</p>'; return; }
  c.innerHTML = DATA.noticias.map(n => `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card-campus ${n.urgente ? 'noticia-urgente' : ''}">
        <div class="card-franja" style="background:${n.urgente ? '#c62828' : '#3949ab'}"></div>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <span class="badge badge-tipo" style="background:${n.urgente ? '#c62828' : '#3949ab'}">${n.tipo || 'Aviso'}</span>
            <small class="text-muted">${n.fecha || ''}</small>
          </div>
          <h6 class="fw-bold mb-1">${n.titulo}</h6>
          <p class="mb-0 small text-muted">${n.descripcion || ''}</p>
        </div>
      </div>
    </div>`).join('');
}

// ===== HORARIO =====
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes'];

function buildHorarioGrid() {
  if (!DATA.horario?.length) return { grid: {}, horas: [] };
  const horas = [...new Set(DATA.horario.map(c => c.hora))].sort();
  const grid = {};
  horas.forEach(h => {
    grid[h] = {};
    DIAS.forEach(d => { grid[h][d] = null; });
  });
  DATA.horario.forEach(c => { grid[c.hora][c.dia] = c; });
  return { grid, horas };
}

function getClaseActual() {
  if (!DATA.horario?.length) return null;
  const ahora = new Date();
  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const diaHoy = diasSemana[ahora.getDay()];
  const horaActual = ahora.getHours() * 100 + ahora.getMinutes();
  return DATA.horario.find(c => {
    if (c.dia !== diaHoy) return false;
    const [h, m] = c.hora.split(':').map(Number);
    const inicio = h * 100 + m;
    return horaActual >= inicio && horaActual < inicio + 100;
  }) || null;
}

function renderHorario() {
  const tabla = document.getElementById('tablaHorario');
  const cards = document.getElementById('horarioCards');
  const { grid, horas } = buildHorarioGrid();
  const claseActual = getClaseActual();

  // --- Desktop tabla ---
  if (tabla && horas.length) {
    // Preservar el colgroup ya definido en el HTML
    let html = '<thead><tr><th>Hora</th>';
    DIAS.forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody>';
    horas.forEach(h => {
      html += `<tr><td class="td-hora">${h}</td>`;
      DIAS.forEach(d => {
        const cls = grid[h][d];
        const esActiva = claseActual &&
          cls?.materia === claseActual.materia &&
          cls?.hora    === claseActual.hora &&
          cls?.dia     === claseActual.dia;
        if (cls) {
          const cc = colorMateria(cls.materia);
          html += `<td class="${esActiva ? 'td-activa' : ''}">
            <span class="pill-materia ${cc}">${cls.materia}<small>${cls.profesor || ''}</small></span>
          </td>`;
        } else {
          html += `<td class="td-libre">&mdash;</td>`;
        }
      });
      html += '</tr>';
    });
    html += '</tbody>';
    // Insertar thead+tbody SIN tocar el colgroup
    const thead = tabla.querySelector('thead');
    const tbody = tabla.querySelector('tbody');
    if (thead) thead.remove();
    if (tbody) tbody.remove();
    tabla.insertAdjacentHTML('beforeend', html);
  }

  // --- Mobile tarjetas ---
  if (cards) {
    let html = '';
    DIAS.forEach(dia => {
      const clasesDia = DATA.horario.filter(c => c.dia === dia).sort((a,b) => a.hora.localeCompare(b.hora));
      if (!clasesDia.length) return;
      html += `<div class="horario-dia-card"><div class="horario-dia-header"><i class="bi bi-calendar-week me-2"></i>${dia}</div>`;
      clasesDia.forEach(c => {
        const cc = colorMateria(c.materia);
        const esActiva = claseActual && c.materia === claseActual.materia && c.hora === claseActual.hora && c.dia === claseActual.dia;
        html += `<div class="horario-dia-item ${esActiva ? 'activa-mobile' : ''}">
          <span class="hora-badge">${c.hora}</span>
          <span class="pill-materia ${cc} flex-grow-1" style="display:block">${c.materia}<small>${c.profesor || ''}</small></span>
          ${esActiva ? '<span class="badge bg-success ms-1" style="font-size:.65rem;flex-shrink:0">Ahora</span>' : ''}
        </div>`;
      });
      html += '</div>';
    });
    cards.innerHTML = html || '<p class="text-muted">Sin datos de horario.</p>';
  }
}

// ===== CLASE ACTIVA BANNER =====
function verificarClaseActiva() {
  const clase = getClaseActual();
  const banner  = document.getElementById('claseActivaBanner');
  const elMat   = document.getElementById('claseActivaMateria');
  const elHora  = document.getElementById('claseActivaHora');
  const elProf  = document.getElementById('claseActivaProf');
  if (!banner) return;
  if (clase) {
    elMat.textContent  = clase.materia;
    elHora.textContent = `${clase.dia} · ${clase.hora} hs`;
    elProf.textContent = clase.profesor || 'Docente';
    banner.classList.remove('d-none');
  } else {
    banner.classList.add('d-none');
  }
}

// ===== EXÁMENES =====
function renderExamenes() {
  const c = document.getElementById('examenesContainer');
  if (!c) return;
  if (!DATA.examenes?.length) { c.innerHTML = '<p class="text-muted">Sin exámenes programados.</p>'; return; }
  const colores = { 'Primer Parcial':'#1a237e', 'Segundo Parcial':'#c62828', 'Final':'#e65100' };
  c.innerHTML = DATA.examenes.map(e => {
    const col = colores[e.tipo] || '#3949ab';
    return `
    <div class="col-12 col-sm-6 col-lg-4">
      <div class="examen-card">
        <div class="examen-top">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="examen-tipo" style="background:${col};color:white">${e.tipo}</span>
            ${e.aula ? `<span class="badge bg-secondary">Aula ${e.aula}</span>` : ''}
          </div>
          <h6 class="fw-bold mb-1">${e.materia}</h6>
          <div class="d-flex align-items-center gap-2 mt-2">
            <i class="bi bi-calendar3" style="color:${col}"></i>
            <span class="fw-semibold">${e.fecha}</span>
            <i class="bi bi-clock ms-2" style="color:${col}"></i>
            <span>${e.hora}</span>
          </div>
        </div>
        <div class="examen-bottom">
          <span><i class="bi bi-person-fill me-1"></i>${e.profesor || 'Docente'}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ===== PARCIALES / TIMELINE =====
function renderParciales() {
  const c = document.getElementById('parcialesTimeline');
  if (!c) return;
  if (!DATA.calendario?.length) { c.innerHTML = '<p class="text-muted">Sin períodos cargados.</p>'; return; }
  const tipos = { normal:'', parcial:'parcial', final:'final' };
  c.innerHTML = DATA.calendario.map(p => `
    <div class="periodo-item ${tipos[p.tipo] || ''}">
      <div class="periodo-mes">${p.mes}</div>
      <div class="periodo-nombre">${p.nombre}</div>
      ${p.fecha ? `<div class="periodo-fecha">${p.fecha}</div>` : ''}
    </div>`).join('');
}

// ===== PROGRAMAS =====
function renderProgramas() {
  const c = document.getElementById('programasContainer');
  if (!c) return;
  if (!DATA.programas?.length) { c.innerHTML = '<p class="text-muted">Sin programas cargados.</p>'; return; }
  c.innerHTML = DATA.programas.map(p => `
    <div class="col-12 col-md-6">
      <div class="programa-card">
        <div class="programa-icon"><i class="bi bi-file-earmark-pdf-fill"></i></div>
        <div class="flex-grow-1">
          <div class="fw-bold">${p.materia}</div>
          <div class="small text-muted mb-2">${p.descripcion || 'Programa oficial de la materia'}</div>
          ${p.pdf ? `<a href="${p.pdf}" target="_blank" class="btn btn-sm btn-primary"><i class="bi bi-download me-1"></i>Descargar PDF</a>` : '<span class="text-muted small">PDF no disponible aún</span>'}
        </div>
      </div>
    </div>`).join('');
}

// ===== LIBROS =====
function renderLibros() {
  const c = document.getElementById('librosContainer');
  if (!c) return;
  if (!DATA.libros?.length) { c.innerHTML = '<p class="text-muted">Sin libros cargados.</p>'; return; }
  c.innerHTML = DATA.libros.map(l => `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="libro-card">
        <div class="libro-cover">
          ${l.imagen ? `<img src="${l.imagen}" alt="${l.titulo}" />` : '<i class="bi bi-book"></i>'}
          <div class="libro-overlay">
            ${l.pdf ? `<a href="${l.pdf}" target="_blank" class="btn btn-light btn-sm"><i class="bi bi-eye me-1"></i>Leer</a>` : ''}
          </div>
        </div>
        <div class="libro-body">
          <div class="libro-materia" style="color:var(--una-azul-claro)">${l.materia || ''}</div>
          <div class="libro-titulo">${l.titulo}</div>
          <div class="libro-autor">${l.autor || ''}</div>
          <div class="mt-2">
            ${l.pdf
              ? `<a href="${l.pdf}" target="_blank" class="btn btn-sm btn-primary w-100"><i class="bi bi-eye me-1"></i>Leer</a>`
              : `<button class="btn btn-sm btn-outline-secondary w-100" disabled>Solo referencia</button>`}
          </div>
        </div>
      </div>
    </div>`).join('');
}

// ===== DRIVE / CLASSROOM =====
function renderDrive() {
  const c = document.getElementById('driveContainer');
  if (!c) return;
  if (!DATA.drive?.length) { c.innerHTML = '<p class="text-muted">Sin carpetas configuradas.</p>'; return; }
  c.innerHTML = DATA.drive.map(d => {
    const tieneDrive     = d.url;
    const tieneClassroom = d.urlClassroom;
    return `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="drive-card">
        <div class="d-flex align-items-center gap-3 flex-grow-1">
          <div class="drive-icon-wrap">
            ${tieneDrive     ? '<i class="bi bi-folder-fill drive-icon drive"></i>'        : ''}
            ${tieneClassroom ? '<i class="bi bi-mortarboard-fill drive-icon classroom"></i>' : ''}
            ${!tieneDrive && !tieneClassroom ? '<i class="bi bi-folder-fill drive-icon drive"></i>' : ''}
          </div>
          <div>
            <div class="fw-bold">${d.materia}</div>
            <div class="small text-muted">${d.descripcion || 'Material del docente'}</div>
          </div>
        </div>
        <div class="d-flex flex-column gap-2">
          ${tieneDrive     ? `<a href="${d.url}"          target="_blank" class="btn btn-outline-primary btn-sm"><i class="bi bi-folder2-open me-1"></i>Drive</a>`      : ''}
          ${tieneClassroom ? `<a href="${d.urlClassroom}" target="_blank" class="btn btn-outline-success btn-sm"><i class="bi bi-mortarboard me-1"></i>Classroom</a>` : ''}
          ${!tieneDrive && !tieneClassroom ? '<span class="text-muted small">Próximamente</span>' : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

// ===== MODO OSCURO =====
function initTema() {
  const btn     = document.getElementById('themeToggle');
  const guardado = localStorage.getItem('tema') || 'light';
  document.documentElement.setAttribute('data-theme', guardado);
  if (btn) {
    btn.innerHTML = guardado === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    btn.addEventListener('click', () => {
      const actual = document.documentElement.getAttribute('data-theme');
      const nuevo  = actual === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nuevo);
      localStorage.setItem('tema', nuevo);
      btn.innerHTML = nuevo === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    });
  }
}

// ===== INSTALAR PWA =====
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });

// ===== DATOS DEMO =====
function datosDemo() {
  return {
    noticias: [
      { titulo:'Inicio de clases', descripcion:'Las clases del segundo semestre comienzan el 4 de agosto.', tipo:'Aviso', fecha:'1 Ago', urgente:false }
    ],
    horario: [
      { dia:'Lunes',     hora:'18:00', materia:'Economía Política', profesor:'Prof. García' },
      { dia:'Lunes',     hora:'19:00', materia:'Economía Política', profesor:'Prof. García' },
      { dia:'Lunes',     hora:'20:00', materia:'Introducción a las Ciencias Políticas', profesor:'Prof. Martínez' },
      { dia:'Martes',    hora:'18:00', materia:'Historia Política Paraguaya', profesor:'Prof. Romero' },
      { dia:'Martes',    hora:'19:00', materia:'Historia Política Paraguaya', profesor:'Prof. Romero' },
      { dia:'Martes',    hora:'20:00', materia:'Introducción a las Ciencias Políticas', profesor:'Prof. Martínez' },
      { dia:'Martes',    hora:'21:00', materia:'Idioma Guaraní II', profesor:'Prof. Ayala' },
      { dia:'Miércoles', hora:'18:00', materia:'Economía Política', profesor:'Prof. García' },
      { dia:'Miércoles', hora:'19:00', materia:'Economía Política', profesor:'Prof. García' },
      { dia:'Miércoles', hora:'20:00', materia:'Historia Política Paraguaya', profesor:'Prof. Romero' },
      { dia:'Jueves',    hora:'18:00', materia:'Idioma Guaraní II', profesor:'Prof. Ayala' },
      { dia:'Jueves',    hora:'19:00', materia:'Idioma Guaraní II', profesor:'Prof. Ayala' },
      { dia:'Jueves',    hora:'21:00', materia:'Idioma Guaraní II', profesor:'Prof. Ayala' },
      { dia:'Viernes',   hora:'18:00', materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', profesor:'Prof. López' },
      { dia:'Viernes',   hora:'19:00', materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', profesor:'Prof. López' },
      { dia:'Viernes',   hora:'20:00', materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', profesor:'Prof. López' }
    ],
    examenes: [
      { materia:'Economía Política', tipo:'Primer Parcial', fecha:'15 Septiembre', hora:'18:00', aula:'4', profesor:'Prof. García' },
      { materia:'Historia Política Paraguaya', tipo:'Primer Parcial', fecha:'17 Septiembre', hora:'18:00', aula:'2', profesor:'Prof. Romero' },
      { materia:'Introducción a las Ciencias Políticas', tipo:'Primer Parcial', fecha:'19 Septiembre', hora:'20:00', aula:'3', profesor:'Prof. Martínez' },
      { materia:'Idioma Guaraní II', tipo:'Primer Parcial', fecha:'22 Septiembre', hora:'18:00', aula:'1', profesor:'Prof. Ayala' },
      { materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', tipo:'Primer Parcial', fecha:'24 Septiembre', hora:'18:00', aula:'4', profesor:'Prof. López' }
    ],
    calendario: [
      { mes:'Agosto',     nombre:'Inicio de Clases', tipo:'normal' },
      { mes:'Septiembre', nombre:'1er Parcial',      tipo:'parcial', fecha:'15–24 Sep' },
      { mes:'Octubre',    nombre:'Cursada',          tipo:'normal' },
      { mes:'Noviembre',  nombre:'2do Parcial',      tipo:'parcial', fecha:'10–21 Nov' },
      { mes:'Diciembre',  nombre:'Finales',          tipo:'final',   fecha:'1–15 Dic' }
    ],
    programas: [
      { materia:'Economía Política', descripcion:'Programa oficial · 2026', pdf:'' },
      { materia:'Historia Política Paraguaya', descripcion:'Programa oficial · 2026', pdf:'' },
      { materia:'Introducción a las Ciencias Políticas', descripcion:'Programa oficial · 2026', pdf:'' },
      { materia:'Idioma Guaraní II', descripcion:'Programa oficial · 2026', pdf:'' },
      { materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', descripcion:'Programa oficial · 2026', pdf:'' }
    ],
    libros: [
      { materia:'Economía Política', titulo:'Principios de Economía', autor:'N. Gregory Mankiw', pdf:'', imagen:'' },
      { materia:'Historia Política Paraguaya', titulo:'Historia del Paraguay', autor:'Carlos Pastore', pdf:'', imagen:'' },
      { materia:'Introducción a las Ciencias Políticas', titulo:'Ciencia Política', autor:'Giovanni Sartori', pdf:'', imagen:'' }
    ],
    drive: [
      { materia:'Economía Política', descripcion:'Carpeta del docente', url:'', urlClassroom:'' },
      { materia:'Historia Política Paraguaya', descripcion:'Carpeta del docente', url:'', urlClassroom:'' },
      { materia:'Introducción a las Ciencias Políticas', descripcion:'Carpeta del docente', url:'', urlClassroom:'' },
      { materia:'Idioma Guaraní II', descripcion:'Carpeta del docente', url:'', urlClassroom:'' },
      { materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', descripcion:'Carpeta del docente', url:'', urlClassroom:'' }
    ]
  };
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', cargarDatos);
