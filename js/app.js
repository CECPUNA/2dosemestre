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
  'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)': 'color-seminario'
};

function colorMateria(nombre) {
  for (const [key, cls] of Object.entries(COLORES_MATERIAS)) {
    if (nombre && nombre.includes(key.split(' ')[0])) return cls;
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
  renderNoticias();
  renderHorario();
  renderExamenes();
  renderParciales();
  renderProgramas();
  renderLibros();
  renderDrive();
  verificarEnClase();
  initBuscador();
}

// ===== NOTICIAS =====
function renderNoticias() {
  const c = document.getElementById('noticiasContainer');
  if (!c || !DATA.noticias?.length) {
    if (c) c.innerHTML = '<p class="text-muted">Sin avisos por el momento.</p>';
    return;
  }
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
  if (!DATA.horario?.length) return {};
  const grid = {};
  const horas = new Set();
  DATA.horario.forEach(c => { horas.add(c.hora); });
  Array.from(horas).sort().forEach(h => {
    grid[h] = {};
    DIAS.forEach(d => { grid[h][d] = null; });
  });
  DATA.horario.forEach(c => {
    if (!grid[c.hora]) grid[c.hora] = {};
    grid[c.hora][c.dia] = c;
  });
  return grid;
}

function renderHorario() {
  const tabla = document.getElementById('tablaHorario');
  const cards = document.getElementById('horarioCards');
  const grid = buildHorarioGrid();
  const horas = Object.keys(grid).sort();

  // Desktop
  if (tabla) {
    let html = '<thead><tr><th>Hora</th>';
    DIAS.forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody>';
    horas.forEach(h => {
      html += `<tr><td class="td-hora">${h}</td>`;
      DIAS.forEach(d => {
        const cls = grid[h][d];
        if (cls) {
          const cc = colorMateria(cls.materia);
          html += `<td><span class="pill-materia ${cc}">${cls.materia}<br><small class="fw-normal opacity-75">${cls.profesor || ''}</small></span></td>`;
        } else {
          html += `<td class="td-libre">—</td>`;
        }
      });
      html += '</tr>';
    });
    html += '</tbody>';
    tabla.innerHTML = html;
  }

  // Mobile
  if (cards) {
    let html = '';
    DIAS.forEach(dia => {
      const clasesDia = DATA.horario.filter(c => c.dia === dia).sort((a,b) => a.hora.localeCompare(b.hora));
      if (!clasesDia.length) return;
      html += `<div class="horario-dia-card"><div class="horario-dia-header"><i class="bi bi-calendar-week me-2"></i>${dia}</div>`;
      clasesDia.forEach(c => {
        const cc = colorMateria(c.materia);
        html += `<div class="horario-dia-item"><span class="hora-badge">${c.hora}</span><span class="pill-materia ${cc} flex-grow-1">${c.materia}${c.profesor ? `<br><small class="fw-normal opacity-75">${c.profesor}</small>` : ''}</span></div>`;
      });
      html += '</div>';
    });
    cards.innerHTML = html || '<p class="text-muted">Sin datos de horario.</p>';
  }
}

// ===== EN CLASE AHORA =====
function verificarEnClase() {
  if (!DATA.horario?.length) return;
  const ahora = new Date();
  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const diaHoy = diasSemana[ahora.getDay()];
  const horaActual = ahora.getHours() * 100 + ahora.getMinutes();

  const clase = DATA.horario.find(c => {
    if (c.dia !== diaHoy) return false;
    const [h, m] = c.hora.split(':').map(Number);
    const inicio = h * 100 + m;
    return horaActual >= inicio && horaActual < inicio + 100;
  });

  const bloque = document.getElementById('enClaseAhora');
  const texto = document.getElementById('enClaseTexto');
  if (clase && bloque && texto) {
    texto.textContent = `En clase ahora: ${clase.materia}`;
    bloque.classList.remove('d-none');
    bloque.classList.add('d-inline-flex');
  }
}

// ===== EXÁMENES =====
function renderExamenes() {
  const c = document.getElementById('examenesContainer');
  if (!c || !DATA.examenes?.length) {
    if (c) c.innerHTML = '<p class="text-muted">Sin exámenes programados.</p>';
    return;
  }
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
  if (!c || !DATA.calendario?.length) {
    if (c) c.innerHTML = '<p class="text-muted">Sin períodos cargados.</p>';
    return;
  }
  const tipos = { 'normal':'', 'parcial':'parcial', 'final':'final' };
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
  if (!c || !DATA.programas?.length) {
    if (c) c.innerHTML = '<p class="text-muted">Sin programas cargados.</p>';
    return;
  }
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
  if (!c || !DATA.libros?.length) {
    if (c) c.innerHTML = '<p class="text-muted">Sin libros cargados.</p>';
    return;
  }
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

// ===== DRIVE =====
function renderDrive() {
  const c = document.getElementById('driveContainer');
  if (!c || !DATA.drive?.length) {
    if (c) c.innerHTML = '<p class="text-muted">Sin carpetas de Drive configuradas.</p>';
    return;
  }
  c.innerHTML = DATA.drive.map(d => `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="drive-card">
        <div class="d-flex align-items-center gap-3">
          <i class="drive-icon bi bi-folder-fill"></i>
          <div>
            <div class="fw-bold">${d.materia}</div>
            <div class="small text-muted">${d.descripcion || 'Material del docente'}</div>
          </div>
        </div>
        ${d.url ? `<a href="${d.url}" target="_blank" class="btn btn-outline-primary btn-sm"><i class="bi bi-box-arrow-up-right me-1"></i>Abrir</a>` : '<span class="text-muted small">Próximamente</span>'}
      </div>
    </div>`).join('');
}

// ===== BUSCADOR =====
function initBuscador() {
  const input = document.getElementById('buscador');
  const resultados = document.getElementById('resultadosBusqueda');
  if (!input || !resultados) return;

  const items = [];
  DATA.horario?.forEach(c => items.push({ tipo:'Materia', texto: c.materia, sub: c.profesor }));
  DATA.examenes?.forEach(e => items.push({ tipo:'Examen', texto: e.materia, sub: `${e.fecha} ${e.hora}` }));
  DATA.libros?.forEach(l => items.push({ tipo:'Libro', texto: l.titulo, sub: l.autor, url: l.pdf }));
  DATA.drive?.forEach(d => items.push({ tipo:'Drive', texto: d.materia, sub: d.descripcion, url: d.url }));

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { resultados.classList.add('d-none'); return; }
    const found = items.filter(i => i.texto.toLowerCase().includes(q) || (i.sub || '').toLowerCase().includes(q)).slice(0, 8);
    if (!found.length) { resultados.classList.add('d-none'); return; }
    resultados.innerHTML = found.map(i => `
      <div class="resultado-item" onclick="this.parentElement.classList.add('d-none')">
        <span class="badge bg-secondary me-2" style="font-size:.68rem">${i.tipo}</span>
        <span class="fw-semibold">${i.texto}</span>
        ${i.sub ? `<span class="text-muted ms-2 small">${i.sub}</span>` : ''}
        ${i.url ? `<a href="${i.url}" target="_blank" class="btn btn-sm btn-link p-0 ms-2">Abrir</a>` : ''}
      </div>`).join('');
    resultados.classList.remove('d-none');
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !resultados.contains(e.target)) resultados.classList.add('d-none');
  });
}

// ===== MODO OSCURO =====
function initTema() {
  const btn = document.getElementById('themeToggle');
  const guardado = localStorage.getItem('tema') || 'light';
  document.documentElement.setAttribute('data-theme', guardado);
  if (btn) {
    btn.innerHTML = guardado === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    btn.addEventListener('click', () => {
      const actual = document.documentElement.getAttribute('data-theme');
      const nuevo = actual === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nuevo);
      localStorage.setItem('tema', nuevo);
      btn.innerHTML = nuevo === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    });
  }
}

// ===== INSTALAR PWA =====
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('btnInstalar');
  if (btn) {
    btn.classList.remove('d-none');
    btn.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => { btn.classList.add('d-none'); });
    });
  }
});

// ===== DATOS DEMO =====
function datosDemo() {
  return {
    noticias: [
      { titulo: 'Inicio de clases', descripcion: 'Las clases del segundo semestre comienzan el 4 de agosto.', tipo: 'Aviso', fecha: '1 Ago', urgente: false }
    ],
    horario: [
      { dia:'Lunes',    hora:'18:00', materia:'Economía Política', profesor:'Prof. García' },
      { dia:'Lunes',    hora:'19:00', materia:'Economía Política', profesor:'Prof. García' },
      { dia:'Lunes',    hora:'20:00', materia:'Introducción a las Ciencias Políticas', profesor:'Prof. Martínez' },
      { dia:'Martes',   hora:'18:00', materia:'Historia Política Paraguaya', profesor:'Prof. Romero' },
      { dia:'Martes',   hora:'19:00', materia:'Historia Política Paraguaya', profesor:'Prof. Romero' },
      { dia:'Martes',   hora:'20:00', materia:'Introducción a las Ciencias Políticas', profesor:'Prof. Martínez' },
      { dia:'Martes',   hora:'21:00', materia:'Idioma Guaraní II', profesor:'Prof. Ayala' },
      { dia:'Miércoles',hora:'18:00', materia:'Economía Política', profesor:'Prof. García' },
      { dia:'Miércoles',hora:'19:00', materia:'Economía Política', profesor:'Prof. García' },
      { dia:'Miércoles',hora:'20:00', materia:'Historia Política Paraguaya', profesor:'Prof. Romero' },
      { dia:'Jueves',   hora:'18:00', materia:'Idioma Guaraní II', profesor:'Prof. Ayala' },
      { dia:'Jueves',   hora:'19:00', materia:'Idioma Guaraní II', profesor:'Prof. Ayala' },
      { dia:'Jueves',   hora:'21:00', materia:'Idioma Guaraní II', profesor:'Prof. Ayala' },
      { dia:'Viernes',  hora:'18:00', materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', profesor:'Prof. López' },
      { dia:'Viernes',  hora:'19:00', materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', profesor:'Prof. López' },
      { dia:'Viernes',  hora:'20:00', materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', profesor:'Prof. López' }
    ],
    examenes: [
      { materia:'Economía Política', tipo:'Primer Parcial', fecha:'15 Septiembre', hora:'18:00', aula:'4', profesor:'Prof. García' },
      { materia:'Historia Política Paraguaya', tipo:'Primer Parcial', fecha:'17 Septiembre', hora:'18:00', aula:'2', profesor:'Prof. Romero' },
      { materia:'Introducción a las Ciencias Políticas', tipo:'Primer Parcial', fecha:'19 Septiembre', hora:'20:00', aula:'3', profesor:'Prof. Martínez' },
      { materia:'Idioma Guaraní II', tipo:'Primer Parcial', fecha:'22 Septiembre', hora:'18:00', aula:'1', profesor:'Prof. Ayala' },
      { materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', tipo:'Primer Parcial', fecha:'24 Septiembre', hora:'18:00', aula:'4', profesor:'Prof. López' }
    ],
    calendario: [
      { mes:'Agosto', nombre:'Inicio de Clases', tipo:'normal' },
      { mes:'Septiembre', nombre:'1er Parcial', tipo:'parcial', fecha:'15–24 Sep' },
      { mes:'Octubre', nombre:'Cursada', tipo:'normal' },
      { mes:'Noviembre', nombre:'2do Parcial', tipo:'parcial', fecha:'10–21 Nov' },
      { mes:'Diciembre', nombre:'Finales', tipo:'final', fecha:'1–15 Dic' }
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
      { materia:'Economía Política', descripcion:'Carpeta del docente', url:'' },
      { materia:'Historia Política Paraguaya', descripcion:'Carpeta del docente', url:'' },
      { materia:'Introducción a las Ciencias Políticas', descripcion:'Carpeta del docente', url:'' },
      { materia:'Idioma Guaraní II', descripcion:'Carpeta del docente', url:'' },
      { materia:'Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)', descripcion:'Carpeta del docente', url:'' }
    ]
  };
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initTema();
  cargarDatos();
});
