self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // 🛑 Let API POST/PUT/DELETE (like file upload) go directly to the network
  if (url.pathname.startsWith("/api/") && event.request.method !== "GET") {
    return
  }

  // ✅ Example: cache-first only for GET requests
  if (event.request.method === "GET") {
    event.respondWith(
      caches.open("cheddit-cache").then(async (cache) => {
        try {
          const response = await fetch(event.request)
          cache.put(event.request, response.clone())
          return response
        } catch (err) {
          const cached = await cache.match(event.request)
          return cached || Response.error()
        }
      })
    )
  }
})
