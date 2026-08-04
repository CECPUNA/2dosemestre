/* ===================================================
   Campus Informativo · 2do Semestre · app.js
   =================================================== */

const DATA_URL = `data/2do.json?_v=${Date.now()}`;
let DATA = null;

const COLORES_MATERIAS = {
  'Econom\u00eda Pol\u00edtica': 'color-econopolitica',
  'Introducci\u00f3n a las Ciencias Pol\u00edticas': 'color-introccp',
  'Historia Pol\u00edtica Paraguaya': 'color-historiapolit',
  'Idioma Guaran\u00ed II': 'color-guarani',
  'Seminario II': 'color-seminario'
};

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

function colorMateria(nombre) {
  if (!nombre) return 'color-econopolitica';
  for (const [key, cls] of Object.entries(COLORES_MATERIAS)) {
    if (nombre.startsWith(key)) return cls;
  }
  return 'color-econopolitica';
}

async function cargarDatos() {
  try {
    const resp = await fetch(DATA_URL, { cache: 'no-store' });
    DATA = await resp.json();
  } catch (e) {
    DATA = datosDemo();
  }
  renderAll();
}

function renderAll() {
  verificarClaseActiva();
  renderHorario();
  renderNoticias();
  renderExamenes();
  renderParciales();
  renderProgramas();
  renderLibros();
  renderDrive();
  initTema();
}

// -- NOTICIAS -- con boton WhatsApp en urgentes
function renderNoticias() {
  const c = document.getElementById('noticiasContainer');
  if (!c) return;
  if (!DATA.noticias?.length) { c.innerHTML = '<p class="text-muted">Sin avisos por el momento.</p>'; return; }
  c.innerHTML = DATA.noticias.map(n => {
    const msg = '*' + n.titulo + '*\n' + (n.descripcion || '') + '\n\n_Campus 2do Semestre \u00b7 Cs. Pol\u00edticas UNA_';
    const waText = encodeURIComponent(msg);
    const waBtn = n.urgente
      ? '<a href="https://wa.me/?text=' + waText + '" target="_blank" class="btn btn-sm btn-success mt-2 w-100"><i class="bi bi-whatsapp me-1"></i>Compartir por WhatsApp</a>'
      : '';
    return '<div class="col-12 col-md-6 col-lg-4">'
      + '<div class="card-campus ' + (n.urgente ? 'noticia-urgente' : '') + '">'
      + '<div class="card-franja" style="background:' + (n.urgente ? '#c62828' : '#3949ab') + '"></div>'
      + '<div class="card-body">'
      + '<div class="d-flex justify-content-between align-items-start mb-2">'
      + '<span class="badge badge-tipo" style="background:' + (n.urgente ? '#c62828' : '#3949ab') + '">' + esc(n.tipo || 'Aviso') + '</span>'
      + '<small class="text-muted">' + esc(n.fecha || '') + '</small>'
      + '</div>'
      + '<h6 class="fw-bold mb-1">' + esc(n.titulo) + '</h6>'
      + '<p class="mb-0 small text-muted">' + esc(n.descripcion || '') + '</p>'
      + waBtn
      + '</div></div></div>';
  }).join('');
}

const DIAS = ['Lunes','Martes','Mi\u00e9rcoles','Jueves','Viernes'];
const DURACION_BLOQUE = 45; // minutos por bloque horario

function buildHorarioGrid() {
  if (!DATA.horario?.length) return { grid: {}, horas: [] };
  const horas = [...new Set(DATA.horario.map(c => c.hora))].sort();
  const grid = {};
  horas.forEach(h => { grid[h] = {}; DIAS.forEach(d => { grid[h][d] = null; }); });
  DATA.horario.forEach(c => { grid[c.hora][c.dia] = c; });
  return { grid, horas };
}

// Convierte "HH:MM" a minutos totales desde medianoche
function horaAMin(horaStr) {
  const [h, m] = horaStr.split(':').map(Number);
  return h * 60 + m;
}

function getClaseActual() {
  if (!DATA.horario?.length) return null;
  const ahora = new Date();
  const diasSemana = ['Domingo','Lunes','Martes','Mi\u00e9rcoles','Jueves','Viernes','S\u00e1bado'];
  const diaHoy = diasSemana[ahora.getDay()];
  const minActual = ahora.getHours() * 60 + ahora.getMinutes();
  return DATA.horario.find(c => {
    if (c.dia !== diaHoy) return false;
    const inicio = horaAMin(c.hora);
    const fin    = inicio + DURACION_BLOQUE;
    return minActual >= inicio && minActual < fin;
  }) || null;
}

function getProximaClaseHoy() {
  if (!DATA.horario?.length) return null;
  const ahora = new Date();
  const diasSemana = ['Domingo','Lunes','Martes','Mi\u00e9rcoles','Jueves','Viernes','S\u00e1bado'];
  const diaHoy = diasSemana[ahora.getDay()];
  const minActual = ahora.getHours() * 60 + ahora.getMinutes();
  const clasesHoy = DATA.horario
    .filter(c => c.dia === diaHoy)
    .map(c => ({ ...c, min: horaAMin(c.hora) }))
    .sort((a, b) => a.min - b.min);
  const seen = new Set();
  for (const c of clasesHoy) {
    const key = c.hora + '_' + c.materia;
    if (seen.has(key)) continue;
    seen.add(key);
    if (c.min > minActual) return c;
  }
  return null;
}

function renderHorario() {
  const tabla = document.getElementById('tablaHorario');
  const cards = document.getElementById('horarioCards');
  const { grid, horas } = buildHorarioGrid();
  const claseActual = getClaseActual();
  if (tabla && horas.length) {
    let html = '<thead><tr><th>Hora</th>';
    DIAS.forEach(d => html += '<th>' + esc(d) + '</th>');
    html += '</tr></thead><tbody>';
    horas.forEach(h => {
      html += '<tr><td class="td-hora">' + esc(h) + '</td>';
      DIAS.forEach(d => {
        const cls = grid[h][d];
        const esActiva = claseActual && cls?.materia === claseActual.materia && cls?.hora === claseActual.hora && cls?.dia === claseActual.dia;
        if (cls) {
          const cc = colorMateria(cls.materia);
          html += '<td class="' + (esActiva ? 'td-activa' : '') + '"><span class="pill-materia ' + cc + '">' + esc(cls.materia) + '<small>' + esc(cls.profesor || '') + '</small></span></td>';
        } else {
          html += '<td class="td-libre">&mdash;</td>';
        }
      });
      html += '</tr>';
    });
    html += '</tbody>';
    tabla.innerHTML = html;
  }
  if (cards) {
    let html = '';
    DIAS.forEach(dia => {
      const clasesDia = DATA.horario.filter(c => c.dia === dia).sort((a,b) => a.hora.localeCompare(b.hora));
      if (!clasesDia.length) return;
      html += '<div class="horario-dia-card"><div class="horario-dia-header"><i class="bi bi-calendar-week me-2"></i>' + esc(dia) + '</div>';
      clasesDia.forEach(c => {
        const cc = colorMateria(c.materia);
        const esActiva = claseActual && c.materia === claseActual.materia && c.hora === claseActual.hora && c.dia === claseActual.dia;
        html += '<div class="horario-dia-item ' + (esActiva ? 'activa-mobile' : '') + '">'
          + '<span class="hora-badge">' + esc(c.hora) + '</span>'
          + '<span class="pill-materia ' + cc + ' flex-grow-1" style="display:block">' + esc(c.materia) + '<small>' + esc(c.profesor || '') + '</small></span>'
          + (esActiva ? '<span class="badge bg-success ms-1" style="font-size:.65rem;flex-shrink:0">Ahora</span>' : '')
          + '</div>';
      });
      html += '</div>';
    });
    cards.innerHTML = html || '<p class="text-muted">Sin datos de horario.</p>';
  }
}

function verificarClaseActiva() {
  const clase   = getClaseActual();
  const proxima = getProximaClaseHoy();
  const banner  = document.getElementById('claseActivaBanner');
  const elMat   = document.getElementById('claseActivaMateria');
  const elHora  = document.getElementById('claseActivaHora');
  const elProf  = document.getElementById('claseActivaProf');
  const elLabel = banner?.querySelector('.clase-activa-label');
  const elPunto = banner?.querySelector('.punto-verde');
  if (!banner) return;
  if (clase) {
    if (elLabel) elLabel.textContent = 'Clase activa';
    if (elPunto) elPunto.style.background = '#22c55e';
    elMat.textContent  = clase.materia;
    elHora.textContent = clase.dia + ' \u00b7 ' + clase.hora + ' hs';
    elProf.textContent = clase.profesor || 'Docente';
    banner.classList.remove('d-none');
  } else if (proxima) {
    if (elLabel) elLabel.textContent = 'Pr\u00f3xima clase hoy';
    if (elPunto) elPunto.style.background = '#f59e0b';
    elMat.textContent  = proxima.materia;
    elHora.textContent = proxima.dia + ' \u00b7 ' + proxima.hora + ' hs';
    elProf.textContent = proxima.profesor || 'Docente';
    banner.classList.remove('d-none');
  } else {
    banner.classList.add('d-none');
  }
}

// -- EXAMENES -- con boton WhatsApp
function renderExamenes() {
  const c = document.getElementById('examenesContainer');
  if (!c) return;
  if (!DATA.examenes?.length) { c.innerHTML = '<p class="text-muted">Sin ex\u00e1menes programados.</p>'; return; }
  const colores = { 'Primer Parcial':'#1a237e', 'Segundo Parcial':'#c62828', 'Final':'#e65100' };
  c.innerHTML = DATA.examenes.map(e => {
    const col = colores[e.tipo] || '#3949ab';
    const lineas = [
      '*' + e.tipo + ' \u2014 ' + e.materia + '*',
      'Fecha: ' + e.fecha,
      'Hora: ' + e.hora,
      e.aula     ? 'Aula: ' + e.aula     : null,
      e.profesor ? 'Prof: ' + e.profesor : null,
      '',
      '_Campus 2do Semestre \u00b7 Cs. Pol\u00edticas UNA_'
    ].filter(l => l !== null).join('\n');
    const waText = encodeURIComponent(lineas);
    return '<div class="col-12 col-sm-6 col-lg-4">'
      + '<div class="examen-card">'
      + '<div class="examen-top">'
      + '<div class="d-flex justify-content-between align-items-center mb-3">'
      + '<span class="examen-tipo" style="background:' + col + ';color:white">' + esc(e.tipo) + '</span>'
      + (e.aula ? '<span class="badge bg-secondary">Aula ' + esc(e.aula) + '</span>' : '')
      + '</div>'
      + '<h6 class="fw-bold mb-1">' + esc(e.materia) + '</h6>'
      + '<div class="d-flex align-items-center gap-2 mt-2">'
      + '<i class="bi bi-calendar3" style="color:' + col + '"></i><span class="fw-semibold">' + esc(e.fecha) + '</span>'
      + '<i class="bi bi-clock ms-2" style="color:' + col + '"></i><span>' + esc(e.hora) + '</span>'
      + '</div></div>'
      + '<div class="examen-bottom d-flex justify-content-between align-items-center">'
      + '<span><i class="bi bi-person-fill me-1"></i>' + esc(e.profesor || 'Docente') + '</span>'
      + '<a href="https://wa.me/?text=' + waText + '" target="_blank" class="btn btn-sm btn-success"><i class="bi bi-whatsapp me-1"></i>Compartir</a>'
      + '</div></div></div>';
  }).join('');
}

function renderParciales() {
  const c = document.getElementById('parcialesTimeline');
  if (!c) return;
  if (!DATA.calendario?.length) { c.innerHTML = '<p class="text-muted">Sin per\u00edodos cargados.</p>'; return; }
  c.innerHTML = DATA.calendario.map(p =>
    '<div class="periodo-item ' + (p.tipo === 'parcial' ? 'parcial' : p.tipo === 'final' ? 'final' : '') + '">'
    + '<div class="periodo-mes">' + esc(p.mes) + '</div>'
    + '<div class="periodo-nombre">' + esc(p.nombre) + '</div>'
    + (p.fecha ? '<div class="periodo-fecha">' + esc(p.fecha) + '</div>' : '')
    + '</div>'
  ).join('');
}

function renderProgramas() {
  const c = document.getElementById('programasContainer');
  if (!c) return;
  if (!DATA.programas?.length) { c.innerHTML = '<p class="text-muted">Sin programas cargados.</p>'; return; }
  c.innerHTML = DATA.programas.map(p =>
    '<div class="col-12 col-md-6">'
    + '<div class="programa-card">'
    + '<div class="programa-icon"><i class="bi bi-file-earmark-pdf-fill"></i></div>'
    + '<div class="flex-grow-1">'
    + '<div class="fw-bold">' + esc(p.materia) + '</div>'
    + '<div class="small text-muted mb-2">' + esc(p.descripcion || 'Programa oficial de la materia') + '</div>'
    + (p.pdf ? '<a href="' + esc(p.pdf) + '" target="_blank" class="btn btn-sm btn-primary"><i class="bi bi-download me-1"></i>Descargar PDF</a>' : '<span class="text-muted small">PDF no disponible a\u00fan</span>')
    + '</div></div></div>'
  ).join('');
}

// -- LIBROS -- con filtro por materia
function renderLibros(filtro) {
  const c = document.getElementById('librosContainer');
  if (!c) return;
  if (!DATA.libros?.length) { c.innerHTML = '<p class="text-muted">Sin libros cargados.</p>'; return; }
  const wrapperId = 'libros-filtro-wrap';
  if (!document.getElementById(wrapperId)) {
    const mats = [...new Set(DATA.libros.map(l => l.materia))].sort();
    const sel = document.createElement('div');
    sel.id = wrapperId;
    sel.className = 'mb-3';
    sel.innerHTML = '<select id="libros-filtro" class="form-select form-select-sm" style="max-width:340px">'
      + '<option value="">Todas las materias</option>'
      + mats.map(m => '<option value="' + esc(m) + '">' + esc(m) + '</option>').join('')
      + '</select>';
    c.parentElement.insertBefore(sel, c);
    document.getElementById('libros-filtro').addEventListener('change', e => renderLibros(e.target.value));
  }
  const selEl  = document.getElementById('libros-filtro');
  const activo = filtro !== undefined ? filtro : (selEl ? selEl.value : '');
  const lista  = activo ? DATA.libros.filter(l => l.materia === activo) : DATA.libros;
  if (!lista.length) { c.innerHTML = '<p class="text-muted">Sin libros para esta materia.</p>'; return; }
  c.innerHTML = lista.map(l =>
    '<div class="col-6 col-md-4 col-lg-3">'
    + '<div class="libro-card">'
    + '<div class="libro-cover">'
    + (l.imagen ? '<img src="' + esc(l.imagen) + '" alt="' + esc(l.titulo) + '" />' : '<i class="bi bi-book"></i>')
    + '<div class="libro-overlay">' + (l.pdf ? '<a href="' + esc(l.pdf) + '" target="_blank" class="btn btn-light btn-sm"><i class="bi bi-eye me-1"></i>Leer</a>' : '') + '</div>'
    + '</div>'
    + '<div class="libro-body">'
    + '<div class="libro-materia" style="color:var(--una-azul-claro)">' + esc(l.materia || '') + '</div>'
    + '<div class="libro-titulo">' + esc(l.titulo) + '</div>'
    + '<div class="libro-autor">' + esc(l.autor || '') + '</div>'
    + '<div class="mt-2">'
    + (l.pdf ? '<a href="' + esc(l.pdf) + '" target="_blank" class="btn btn-sm btn-primary w-100"><i class="bi bi-eye me-1"></i>Leer</a>' : '<button class="btn btn-sm btn-outline-secondary w-100" disabled>Solo referencia</button>')
    + '</div></div></div></div>'
  ).join('');
}

// -- DRIVE -- con filtro por materia
function renderDrive(filtro) {
  const c = document.getElementById('driveContainer');
  if (!c) return;
  if (!DATA.drive?.length) { c.innerHTML = '<p class="text-muted">Sin carpetas configuradas.</p>'; return; }
  const wrapperId = 'drive-filtro-wrap';
  if (!document.getElementById(wrapperId)) {
    const mats = [...new Set(DATA.drive.map(d => d.materia))].sort();
    const sel = document.createElement('div');
    sel.id = wrapperId;
    sel.className = 'mb-3';
    sel.innerHTML = '<select id="drive-filtro" class="form-select form-select-sm" style="max-width:340px">'
      + '<option value="">Todas las materias</option>'
      + mats.map(m => '<option value="' + esc(m) + '">' + esc(m) + '</option>').join('')
      + '</select>';
    c.parentElement.insertBefore(sel, c);
    document.getElementById('drive-filtro').addEventListener('change', e => renderDrive(e.target.value));
  }
  const selEl  = document.getElementById('drive-filtro');
  const activo = filtro !== undefined ? filtro : (selEl ? selEl.value : '');
  const lista  = activo ? DATA.drive.filter(d => d.materia === activo) : DATA.drive;
  if (!lista.length) { c.innerHTML = '<p class="text-muted">Sin carpetas para esta materia.</p>'; return; }
  c.innerHTML = lista.map(d => {
    const tieneDrive = d.url, tieneClassroom = d.urlClassroom;
    return '<div class="col-12 col-md-6 col-lg-4">'
      + '<div class="drive-card">'
      + '<div class="d-flex align-items-center gap-3 flex-grow-1">'
      + '<div class="drive-icon-wrap">'
      + (tieneDrive ? '<i class="bi bi-folder-fill drive-icon drive"></i>' : '')
      + (tieneClassroom ? '<i class="bi bi-mortarboard-fill drive-icon classroom"></i>' : '')
      + (!tieneDrive && !tieneClassroom ? '<i class="bi bi-folder-fill drive-icon drive"></i>' : '')
      + '</div>'
      + '<div><div class="fw-bold">' + esc(d.materia) + '</div><div class="small text-muted">' + esc(d.descripcion || 'Material del docente') + '</div></div>'
      + '</div>'
      + '<div class="d-flex flex-column gap-2">'
      + (tieneDrive ? '<a href="' + esc(d.url) + '" target="_blank" class="btn btn-outline-primary btn-sm"><i class="bi bi-folder2-open me-1"></i>Drive</a>' : '')
      + (tieneClassroom ? '<a href="' + esc(d.urlClassroom) + '" target="_blank" class="btn btn-outline-success btn-sm"><i class="bi bi-mortarboard me-1"></i>Classroom</a>' : '')
      + (!tieneDrive && !tieneClassroom ? '<span class="text-muted small">Pr\u00f3ximamente</span>' : '')
      + '</div></div></div>';
  }).join('');
}

function consultarCI() {
  const input  = document.getElementById('ciInput');
  const inline = document.getElementById('ciResultadoInline');
  const ci = input ? input.value.trim() : '';
  if (!ci) {
    if (inline) inline.innerHTML = '<div class="alert alert-warning py-2 mb-0"><i class="bi bi-exclamation-triangle me-2"></i>Ingres\u00e1 tu n\u00famero de C.I.</div>';
    return;
  }
  const lista    = DATA?.infoci || [];
  const registro = lista.find(r => String(r.ci).trim() === ci);
  if (registro) {
    const modalBody = document.getElementById('ciModalBody');
    if (modalBody) {
      modalBody.innerHTML = '';

      const avatar = document.createElement('div');
      avatar.className = 'text-center mb-3';
      avatar.innerHTML = '<div style="width:56px;height:56px;border-radius:50%;background:#e8eaf6;display:inline-flex;align-items:center;justify-content:center;font-size:1.6rem;color:#1a237e"><i class="bi bi-person-check"></i></div>';
      modalBody.appendChild(avatar);

      const ciPara = document.createElement('p');
      ciPara.className = 'text-center text-muted small mb-3';
      ciPara.innerHTML = 'C.I.: <strong>' + esc(ci) + '</strong>';
      modalBody.appendChild(ciPara);

      const msgDiv = document.createElement('div');
      msgDiv.className = 'p-3';
      msgDiv.style.cssText = 'background:#f0f2f8;border-radius:10px;font-size:.97rem;line-height:1.6;';
      const lineas = registro.mensaje.split('\n');
      lineas.forEach((linea, i) => {
        msgDiv.appendChild(document.createTextNode(linea));
        if (i < lineas.length - 1) msgDiv.appendChild(document.createElement('br'));
      });
      modalBody.appendChild(msgDiv);
    }
    const modal = new bootstrap.Modal(document.getElementById('ciModal'));
    modal.show();
    if (inline) inline.innerHTML = '';
  } else {
    if (inline) inline.innerHTML = '<div class="alert alert-secondary py-2 mb-0"><i class="bi bi-search me-2"></i>No se encontr\u00f3 informaci\u00f3n para ese n\u00famero de C.I.</div>';
  }
}

function initTema() {
  const btn      = document.getElementById('themeToggle');
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

function datosDemo() {
  return {
    noticias: [{ titulo:'Inicio de clases', descripcion:'Las clases del segundo semestre comienzan el 4 de agosto.', tipo:'Aviso', fecha:'1 Ago', urgente:false }],
    horario: [
      { dia:'Lunes', hora:'18:00', materia:'Econom\u00eda Pol\u00edtica', profesor:'Prof. Garc\u00eda' },
      { dia:'Lunes', hora:'18:45', materia:'Econom\u00eda Pol\u00edtica', profesor:'Prof. Garc\u00eda' },
      { dia:'Lunes', hora:'19:45', materia:'Introducci\u00f3n a las Ciencias Pol\u00edticas', profesor:'Prof. Mart\u00ednez' },
      { dia:'Martes', hora:'18:00', materia:'Historia Pol\u00edtica Paraguaya', profesor:'Prof. Romero' },
      { dia:'Martes', hora:'18:45', materia:'Historia Pol\u00edtica Paraguaya', profesor:'Prof. Romero' },
      { dia:'Martes', hora:'19:45', materia:'Introducci\u00f3n a las Ciencias Pol\u00edticas', profesor:'Prof. Mart\u00ednez' },
      { dia:'Martes', hora:'20:30', materia:'Idioma Guaran\u00ed II', profesor:'Prof. Ayala' },
      { dia:'Mi\u00e9rcoles', hora:'18:00', materia:'Econom\u00eda Pol\u00edtica', profesor:'Prof. Garc\u00eda' },
      { dia:'Mi\u00e9rcoles', hora:'18:45', materia:'Econom\u00eda Pol\u00edtica', profesor:'Prof. Garc\u00eda' },
      { dia:'Mi\u00e9rcoles', hora:'19:45', materia:'Historia Pol\u00edtica Paraguaya', profesor:'Prof. Romero' },
      { dia:'Jueves', hora:'18:00', materia:'Idioma Guaran\u00ed II', profesor:'Prof. Ayala' },
      { dia:'Jueves', hora:'18:45', materia:'Idioma Guaran\u00ed II', profesor:'Prof. Ayala' },
      { dia:'Jueves', hora:'20:30', materia:'Idioma Guaran\u00ed II', profesor:'Prof. Ayala' },
      { dia:'Viernes', hora:'18:00', materia:'Seminario II: Movimientos Sociales y Pol\u00edticos en Latam', profesor:'Prof. L\u00f3pez' },
      { dia:'Viernes', hora:'18:45', materia:'Seminario II: Movimientos Sociales y Pol\u00edticos en Latam', profesor:'Prof. L\u00f3pez' },
      { dia:'Viernes', hora:'19:45', materia:'Seminario II: Movimientos Sociales y Pol\u00edticos en Latam', profesor:'Prof. L\u00f3pez' }
    ],
    examenes: [{ materia:'Econom\u00eda Pol\u00edtica', tipo:'Primer Parcial', fecha:'12 de Octubre', hora:'19:00', aula:'', profesor:'Urquiza' }],
    calendario: [
      { mes:'Agosto', nombre:'Inicio de Clases', tipo:'normal' },
      { mes:'Septiembre', nombre:'1er Parcial', tipo:'parcial', fecha:'14\u201325 Sep' },
      { mes:'Octubre', nombre:'Cursada', tipo:'normal' },
      { mes:'Noviembre', nombre:'2do Parcial', tipo:'parcial', fecha:'20\u201330 Nov' },
      { mes:'Diciembre', nombre:'Finales', tipo:'final', fecha:'1\u201315 Dic' }
    ],
    programas: [
      { materia:'Econom\u00eda Pol\u00edtica', descripcion:'Programa oficial \u00b7 2026', pdf:'' },
      { materia:'Historia Pol\u00edtica Paraguaya', descripcion:'Programa oficial \u00b7 2026', pdf:'' },
      { materia:'Introducci\u00f3n a las Ciencias Pol\u00edticas', descripcion:'Programa oficial \u00b7 2026', pdf:'' },
      { materia:'Idioma Guaran\u00ed II', descripcion:'Programa oficial \u00b7 2026', pdf:'' },
      { materia:'Seminario II: Movimientos Sociales y Pol\u00edticos en Latam', descripcion:'Programa oficial \u00b7 2026', pdf:'' }
    ],
    libros: [],
    drive: [],
    infoci: []
  };
}

document.addEventListener('DOMContentLoaded', () => {
  cargarDatos();
  const input = document.getElementById('ciInput');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') consultarCI(); });

  // Actualiza el banner de clase activa/proxima cada 60 segundos automaticamente
  setInterval(() => {
    if (DATA) verificarClaseActiva();
  }, 60000);
});
