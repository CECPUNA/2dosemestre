# Contexto completo del proyecto CECPUNA/2dosemestre

Documento de traspaso para que otra IA (o desarrollador) continue la implementacion de notificaciones push via topics FCM, sin tener que repetir la investigacion de esta conversacion.

## Repositorio

- Owner: CECPUNA
- Repo: 2dosemestre
- Branch: main
- Commits de esta feature:
  - `f56f773` — chore: .gitignore para proteger credenciales
  - `ed2be4f` — feat: Cloud Functions subscribeTopic + sendTopic
  - (este commit) — docs: contexto y pasos de deploy

## Objetivo

Reemplazar la suscripcion a topics FCM hecha desde el frontend (que requeria un Server Key legacy, deshabilitado en este proyecto) por una arquitectura correcta con Cloud Functions + Firebase Admin SDK, usando la API V1 de FCM (ya habilitada).

## Estado del proyecto Firebase

- Project ID: cecpuna
- Sender ID (messagingSenderId): 1046581012780
- App ID (web): 1:1046581012780:web:c0491abc8365ede0f9a489
- Auth Domain: cecpuna.firebaseapp.com
- Storage Bucket: cecpuna.firebasestorage.app
- API de Firebase Cloud Messaging (V1): HABILITADA
- API de Cloud Messaging (legacy Server Key): INHABILITADA (no reactivar)

## Claves publicas (seguro usarlas en frontend)

```js
const FCM_CONFIG = {
  apiKey: 'AIzaSyDss4D0hkjpisn2b5E0sVRKcEef-1WV9gU',
  authDomain: 'cecpuna.firebaseapp.com',
  projectId: 'cecpuna',
  storageBucket: 'cecpuna.firebasestorage.app',
  messagingSenderId: '1046581012780',
  appId: '1:1046581012780:web:c0491abc8365ede0f9a489'
};

const FCM_VAPID_KEY = 'BM-rL4HUVrCpgws1HbWKSfi7DMQ5_vr2MBkjYBZ3DSfJc9uT1H9geyIu6nlfTrO4pRWS5-jQAz6-2qpPy6X0dMg';
```

## SEGURIDAD CRITICA: Service Account

> El archivo de Service Account (cecpuna-XXXX.json) con `private_key` y `client_email`:
> - **JAMAS commitear** en GitHub
> - **JAMAS pegar** en js/app.js, admin.js ni ningun archivo del navegador
> - Da acceso administrativo COMPLETO al proyecto Firebase
> - Cargar SOLO como variable de entorno / secreto de Cloud Functions

Si la clave privada fue expuesta en algun chat previo, revocarla desde:
Firebase Console → Configuracion del proyecto → Cuentas de servicio → Generar nueva clave privada

## Arquitectura implementada

```
Navegador (js/app.js)
  └─ getToken() → FCM token
  └─ POST /subscribeTopic { token } → Cloud Function
                                         └─ admin.messaging().subscribeToTopic()

Panel Admin (admin/js/admin.js)
  └─ POST /sendTopic { password, title, body } → Cloud Function
                                                    └─ admin.messaging().send({ topic: 'all' })
                                                         └─ Push a TODOS los suscritos
```

## Integracion en js/app.js (pendiente)

Agregar esta funcion y llamarla despues de `getToken()`:

```js
async function suscribirTokenEnBackend(token) {
  const resp = await fetch('https://TU_REGION-cecpuna.cloudfunctions.net/subscribeTopic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, topic: 'all' })
  });
  const data = await resp.json();
  if (!resp.ok || !data.ok) throw new Error(data.error || 'subscribe-failed');
  return data;
}
```

## Integracion en admin/js/admin.js (pendiente)

```js
async function enviarPushATodos({ title, body, password }) {
  const resp = await fetch('https://TU_REGION-cecpuna.cloudfunctions.net/sendTopic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, title, body, topic: 'all', url: '/' })
  });
  const data = await resp.json();
  if (!resp.ok || !data.ok) throw new Error(data.error || 'send-failed');
  return data;
}
```

## Pasos de deploy (pendientes)

```bash
# 1. Instalar Firebase CLI
npm install -g firebase-tools

# 2. Login y seleccionar proyecto
firebase login
firebase use cecpuna

# 3. Inicializar functions (si no existe firebase.json)
firebase init functions
# Elegir: proyecto cecpuna, JavaScript, sin ESLint

# 4. Los archivos functions/index.js y functions/package.json ya estan en el repo
#    Solo hacer: cd functions && npm install

# 5. Configurar contrasena de admin como secreto
firebase functions:secrets:set ADMIN_PUSH_PASSWORD
# (ingresar una contrasena segura cuando lo pida)

# 6. Deploy (requiere plan Blaze)
firebase deploy --only functions

# 7. Tomar las URLs del output, ejemplo:
#    https://us-central1-cecpuna.cloudfunctions.net/subscribeTopic
#    https://us-central1-cecpuna.cloudfunctions.net/sendTopic

# 8. Reemplazar 'TU_REGION-cecpuna.cloudfunctions.net' en:
#    - js/app.js (llamada a subscribeTopic)
#    - admin/js/admin.js (llamada a sendTopic)

# 9. Commitear los cambios del frontend (sin ningun secreto)
git add js/app.js admin/js/admin.js
git commit -m "feat: integrate Cloud Functions URLs for FCM push"
git push
```

## Reglas de seguridad para el proximo dev/IA

- Jamas commitear archivos con `"private_key"`, `"type": "service_account"`, o `*.json` de credenciales Firebase Admin
- El Web API Key (`AIzaSy...`) y el VAPID Key son publicos por diseno de Firebase, no requieren la misma proteccion
- El unico lugar seguro para el Service Account es como variable de entorno o secreto de Cloud Functions
- Revisar que `.gitignore` excluya `*.json` de credenciales si se descargan localmente
