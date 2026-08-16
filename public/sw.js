self.addEventListener("push", function (event) {
  let data = {
    title: "FixFlow",
    body: "Tienes una nueva notificación.",
    url: "/",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || "Tienes una nueva notificación.",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    data: {
      url: data.url || "/",
    },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "FixFlow",
      options
    )
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url =
    event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});