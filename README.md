# SportSchool (PWA)

Ejecutar: `python3 -m http.server 8080` y abrir http://localhost:8080
(Service Worker, notificaciones y geolocalizacion requieren localhost o HTTPS).

## Archivos
index.html, style.css, app.js, sw.js, manifest.webmanifest, icons/

## Tecnologias
- Renderizado del lado del cliente (CSR) en JavaScript puro
- Almacenamiento: localStorage (claves ss_students y ss_acts)
- Fetch API: boton "Probar Fetch" envia un POST a jsonplaceholder.typicode.com (demostrativo, no es sincronizacion real)
- Service Worker (network-first) + Cache API para funcionar sin conexion
- Notificacion local al guardar una actividad (con permiso) y Geolocation opcional

## Pruebas sugeridas (evidencias)
1. Registrar un estudiante y dos actividades; recargar y verificar que siguen ahi.
2. DevTools > Application: Manifest, Service Workers, Cache Storage y Local Storage.
3. DevTools > Network > Offline, recargar: la app y los datos siguen disponibles.
4. Lighthouse (categoria PWA / Best practices).

## Si ves una version vieja
DevTools > Application > Service Workers > Unregister, luego Ctrl+Shift+R.
