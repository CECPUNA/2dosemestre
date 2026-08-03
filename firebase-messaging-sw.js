importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDss4D0hkjpisn2b5E0sVRKcEef-1WV9gU',
  authDomain: 'cecpuna.firebaseapp.com',
  projectId: 'cecpuna',
  storageBucket: 'cecpuna.firebasestorage.app',
  messagingSenderId: '1046581012780',
  appId: '1:1046581012780:web:c0491abc8365ede0f9a489'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || '2do Semestre';
  const options = {
    body: payload?.notification?.body || 'Nuevo aviso disponible.',
    icon: 'img/icon-192.png',
    badge: 'img/icon-192.png',
    data: payload?.data || {}
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate?.(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
