# App Informativa - 2° Semestre #
CENTRO DE ESTUDIANTES ESCUELA DE CIENCIAS SOCIALES Y POLITICAS UNA· 
**Escuela de Ciencias Políticas · Universidad Nacional de Asunción**

> PWA instalable — Ciencias Políticas UNA · v1.0

## Acceso
- **Campus:** `https://cecpuna.github.io/2dosemestre/`
- **Admin:** `https://cecpuna.github.io/2dosemestre/admin/login.html`

## Estructura
```
/
├── index.html          ← Página principal del 2do semestre
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker (offline + caché)
├── css/main.css        ← Estilos completos
├── js/app.js           ← Lógica del campus
├── js/admin.js         ← Lógica del panel admin
├── data/2do.json       ← Base de datos JSON editable
├── admin/
│   ├── login.html      ← Acceso al gestor
│   └── dashboard.html  ← Panel de administración
└── img/                ← Íconos PWA (agregar icon-192.png y icon-512.png)
```

## Secciones del Campus
- **Horario** — tabla desktop + tarjetas mobile
- **Noticias** — avisos urgentes del delegado
- **Exámenes** — parciales y finales por materia
- **Períodos** — timeline de evaluaciones
- **Programas** — PDFs de programas oficiales
- **Libros** — material bibliográfico
- **Drive** — carpetas de docentes

## Materias · 2do Semestre
1. Economía Política
2. Introducción a las Ciencias Políticas
3. Historia Política Paraguaya
4. Idioma Guaraní II
5. Seminario II: Movimientos Sociales y Políticos en América Latina (Siglos XX y XXI)

## Gestor Admin
El panel permite editar todo sin tocar código:
- Noticias, Horario, Exámenes, Parciales, Programas, Libros, Drive
- Exportar el JSON actualizado para subir al repo

## GitHub Pages
Activar en: **Settings → Pages → Source: Deploy from branch `main`**
