importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "studio-9342789930-a016b",
  appId: "1:546262459945:web:8f393f6d3077f2d2529e38",
  apiKey: "AIzaSyClX6l7KHUIjo1gSk3g2qCfMjOu9S4kmzY",
  authDomain: "studio-9342789930-a016b.firebaseapp.com",
  messagingSenderId: "546262459945"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
