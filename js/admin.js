const LS_FCM_SERVER_KEY = 'fcm_server_key_cms';

function guardarFCMKey() {
  const key = document.getElementById('fcmServerKey')?.value.trim();
  if (!key) { alert('Ingresá la Server Key de Firebase'); return; }
  localStorage.setItem(LS_FCM_SERVER_KEY, key);
  alert('Server Key guardada');
}

function borrarFCMKey() {
  localStorage.removeItem(LS_FCM_SERVER_KEY);
  const inp = document.getElementById('fcmServerKey');
  if (inp) inp.value = '';
  alert('Server Key eliminada');
}

async function enviarNotificacionFCM() {
  const serverKey = localStorage.getItem(LS_FCM_SERVER_KEY);
  if (!serverKey) {
    alert('Primero guardá la Server Key de Firebase');
    return;
  }

  const title = document.getElementById('pushTitulo')?.value.trim() || '2do Semestre';
  const body = document.getElementById('pushMensaje')?.value.trim();
  const url = document.getElementById('pushUrl')?.value.trim() || 'https://cecpuna.github.io/2dosemestre/';

  if (!body) {
    alert('Escribí el mensaje de la notificación');
    return;
  }

  const payload = {
    to: '/topics/all',
    notification: {
      title,
      body
    },
    data: {
      url
    }
  };

  try {
    const r = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`
      },
      body: JSON.stringify(payload)
    });

    const txt = await r.text();
    if (!r.ok) {
      alert(`Error FCM ${r.status}: ${txt}`);
      return;
    }

    alert('Notificación enviada a FCM');
    console.log(txt);
  } catch (e) {
    alert('Error de red al enviar la notificación');
    console.error(e);
  }
}
