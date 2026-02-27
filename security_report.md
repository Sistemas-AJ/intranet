# Auditoría de Seguridad - Intranet AJ

He revisado el código backend (`server.js`) y el frontend para identificar posibles vulnerabilidades antes del paso a producción. A continuación detallo los hallazgos agrupados por severidad.

## 🔴 Vulnerabilidades Críticas (Alta Severidad)

### 1. Inyección SQL (Parcialmente mitigada, pero con riesgos)
Aunque la mayoría de las consultas usan `db.prepare().get/run()` con parámetros correctos (ej. `(?, ?)`),  hay prácticas que pueden derivar en inyección si no se tiene cuidado en el futuro:
- En `/api/docs/update` (línea 500): `const set = entries.map(([k]) => k + ' = ?').join(', ');` 
  - **Riesgo:** Si un atacante envía un JSON con claves maliciosas en `req.body` (ej: `{"role = 'admin'; --": "valor"}`), se concatenará directamente en la consulta SQL `UPDATE documents SET ...`. 
  - **Solución:** Validar que las claves (`k`) coincidan estrictamente con una lista blanca de columnas permitidas antes de concatenarlas en la consulta SQL.

### 2. Autenticación y Autorización Insegura
- **Contraseñas en texto plano:** Las contraseñas se guardan en la base de datos sin encriptar (línea 245 y 295, se comparan y guardan directamente como strings).
  - **Riesgo:** Si la base de datos se filtra, todas las credenciales quedan expuestas inmediatamente.
  - **Solución:** Usar `bcrypt` para hashear las contraseñas antes de guardarlas y usar `bcrypt.compare` al hacer login.
* **Manejo de Roles basado en Headers (antes):** el middleware `requireRole` usaba `x-ruc` y `x-role` y validaba contra la DB.  
  - **Mitigación aplicada:** la aplicación ahora genera **JWT** en el login y comprueba el token en cada petición (`Authorization: Bearer …`).  Los headers custom sólo se interpretan como respaldo para compatibilidad.
  - **Nota:** los endpoints de modificación ahora exigen el token globalmente mediante `authenticateToken`.

### 3. Path Traversal en Borrado y Lectura de Archivos
- En `/api/docs` DELETE (línea 479 y 486): `fs.unlinkSync(path.join(__dirname, doc.url...))`
- En `/api/upload` (línea 355): `const targetDir = path.join(CLIENTES_DIR, ruc, section, year, month);`
  - **Riesgo:** Aunque hay `sanitize()` para el nombre del archivo original, los campos `ruc`, `section`, `year`, y `month` **no se sanitizan** antes de unirlos en la ruta. Un atacante (incluso un cliente) podría enviar `year: "../../../"` y subir archivos o eliminar archivos fuera de su directorio permitido si logra evadir las validaciones básicas.
  - **Solución recomendada:** aplicar `sanitize()` o una validación estricta de regex (como `/^[a-zA-Z0-9_-]+$/`) a `ruc`, `section`, `year` y `month`. Usar `path.resolve` y verificar que la ruta final comience estrictamente con `CLIENTES_DIR`.
  - **Estado actual:** este riesgo permanece; se debe corregir en una siguiente iteración.

## 🟠 Vulnerabilidades Medias

### 4. Subida de Archivos con Multer y Nombres Predecibles
- Las extensiones de los archivos se basan en el mimetype recibido por multer (línea 195). Si bien se valida el mimetype, la validación de mimetype por sí sola no garantiza que el archivo no contenga código malicioso si el servidor web (ej. Nginx) se configura mal luego.
- Además los archivos subidos van a una carpeta estática expuesta publicamente: `app.use('/clientes', express.static(CLIENTES_DIR))` (línea 534). 
  - **Riesgo:** Cualquier persona (sin estar logueada) que adivine la URL del archivo `/clientes/.../archivo.pdf` puede descargarlo. Los documentos confidenciales NO deberían estar en estáticos públicos.
  - **Solución:** Quitar `app.use('/clientes', express.static(...))`. En su lugar, crear un endpoint `/api/download/:ruc/...` que use `requireRole` para validar que el usuario tiene permisos antes de hacer un `res.sendFile()`.

### 5. Límite de Peticiones (Rate Limiting)
- No hay protección contra fuerza bruta en el endpoint de login (`/api/login`).
  - **Riesgo:** Un atacante puede intentar miles de contraseñas por segundo.
  - **Solución:** Implementar `express-rate-limit` en `/api/login` y llamadas al API.

### 6. Configuración CORS Permisiva en Error
- La variable `ALLOWED_ORIGINS` permite fallos genéricos, y en `/api/login` o si no se manejan bien los tokens, puede ser trivial armar un phishing.

## 🟡 Vulnerabilidades Bajas / Buenas Prácticas

- **Falta de Validación de Datos de Entrada:** En endpoints como `/api/companies` POST, no se valida que el RUC sea un número de 11 dígitos, o que la razón social no contenga scripts (XSS). Aunque el frontend use React (que escapa XSS), los datos basura ensuciarían la DB.
- **Errores muy Descriptivos:** `res.status(500).json({ error: e.message })` puede devolver información sensible de la DB o del File System en caso de error (ej: si a sqlite3 le falla un query devuelve todo el string SQL).

### 7. Uso de LocalStorage para datos de Sesión
- En `Login.jsx` (línea 37) y `Dashboard.jsx`, se guarda el `currentUser` con todos los datos (incluyendo permisos y nombre de usuario) en `localStorage`.
  - **Riesgo:** Un ataque de XSS (Cross Site Scripting) podría leer el `localStorage` y robar la sesión. Si bien React ayuda mucho contra XSS, un componente malicioso de terceros podría extraer las credenciales almacenadas.
  - **Solución:** Lo recomendado en aplicaciones seguras es usar Cookies HTTP-Only para los tokens de sesión, lo cual hace imposible que el JavaScript del navegador los lea.

### 8. Falla lógica en el Check de Notificaciones de Dashboard
- En `Dashboard.jsx` (línea 95): `const data = localStorage.getItem('docs_${ruc}_${sec}');`
  - **Problema:** El Admin verifica si hay nuevos archivos basándose en datos que su *propio* navegador cacheó en `localStorage`. Si el cliente sube un archivo desde otra computadora, esta información no llegará al Admin a menos que él recargue los documentos. Esto no es una vulnerabilidad de seguridad estricta, pero es un problema grave de confiabilidad del negocio. Las notificaciones deben venir del servidor en tiempo real o en la carga inicial de las empresas (`/api/companies`).

## Recomendaciones Inmediatas (Plan de Acción)

Las primeras tres ya han sido abordadas en esta rama:

1. **JWT implementado.** Las peticiones ahora deben llevar `Authorization: Bearer <token>`; los headers antiguos se ignoran salvo compatibilidad.
2. **Contraseñas hasheadas** con bcrypt. Las cuentas existentes se migran al primer login.
3. **Manejar de forma segura las subidas** sigue pendiente: actividad crítica para la próxima fase.
4. **Prevenir SQL Injection** mejorando cómo se hace el Update masivo de columnas (usar whitelist estricto).

Otras sugerencias (rate limiting, static file access, etc.) aún son válidas.
