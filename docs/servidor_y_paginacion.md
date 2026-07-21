# Documentación Técnica: Arquitectura de Servidor y Plan de Paginación

Este documento explica en detalle los dos procesos requeridos:
1. **Gestión del Servidor y Frontend (Node.js vs Docker)**: Cómo interactúan Express, Vite y Docker en desarrollo y producción.
2. **Diagnóstico de la Ráfaga de Peticiones y Plan de Paginación para Compras y Ventas**: Diagnóstico del problema actual de rendimiento y la propuesta técnica paso a paso para implementar paginación y carga bajo demanda.

---

## 📄 Proceso 1: ¿Quién gestiona el Servidor y el Frontend? (Node.js vs Docker)

Existe una diferencia clave entre el entorno de **Desarrollo** y el de **Producción (Docker)**:

```
                  ┌─────────────────────────────────────────────────────────────┐
                  │                 ENTORNO DE DESARROLLO                       │
                  │                                                             │
                  │   Navegador (Navega a http://localhost:5173)                │
                  │        │                                                    │
                  │        ├── Archivos React / HMR ──► Vite (Puerto 5173)      │
                  │        └── Peticiones /api/*    ──► Proxy Vite ──► Node.js (3000)
                  └─────────────────────────────────────────────────────────────┘

                  ┌─────────────────────────────────────────────────────────────┐
                  │              ENTORNO DE PRODUCCIÓN / DOCKER                 │
                  │                                                             │
                  │   Navegador (Navega a https://intranet.adolfojurado.com)     │
                  │        │                                                    │
                  │        └── Todo en 1 solo servicio (Puerto 3500):           │
                  │             Contenedor Node.js (Express Server)             │
                  │             ├── Sirve Frontend estático compilado (dist/)   │
                  │             ├── Procesa API REST (/api/*)                   │
                  │             └── Sirve Archivos Clientes (/clientes/*)       │
                  │             │                                               │
                  │             └── Conecta a Contenedor PostgreSQL 15 (5432)   │
                  └─────────────────────────────────────────────────────────────┘
```

### A. En Desarrollo (`npm run dev` + `npm run start`)
* **Frontend (Vite Server)**: Corre en el puerto `5173`. Encargado del renderizado en vivo, Hot Module Replacement (HMR) y servir código JSX.
* **Backend (Node.js/Express)**: Corre en el puerto `3000`. Procesa la base de datos PostgreSQL, autenticación y subida de archivos.
* **Interconexión**: El archivo `vite.config.js` actúa como proxy y redirige cualquier petición que empiece con `/api` desde el puerto `5173` al puerto `3000`.

### B. En Producción con Docker (`docker-compose up`)
En producción **Node.js (Express)** es el único servidor web que gestiona todo dentro del contenedor `web`:
1. **Compilación previa**: En el paso `RUN npm run build` de Docker, Vite compila todo el React SPA en archivos HTML/JS/CSS estáticos dentro de `/app/dist`.
2. **Servidor unificado Express (`server.js`)**:
   * Sirve el frontend compilado usando `express.static('dist')`.
   * Atiende la API REST en la ruta `/api/*`.
   * Sirve directamente las descargas de comprobantes físicos en la ruta `/clientes/*`.
3. **Docker Compose**: Se encarga del orquestamiento de contenedores:
   * Contenedor `web`: Servidor Express en Node.js 20.
   * Contenedor `db`: Base de datos PostgreSQL 15.

---

## ⚡ Proceso 2: Diagnóstico de Ráfaga de Peticiones y Plan de Paginación

### 1. Diagnóstico del Problema Actual

Al ingresar a la vista de una empresa (`/company/:ruc`), ocurren dos inconvenientes de rendimiento:

#### Inconveniente A: Ráfaga de 17 Peticiones HTTP Simultáneas (*Waterfall/Burst*)
En `src/CompanyDashboard.jsx`, al renderizar la página, se instancian **17 llamadas simultáneas** al hook `useDocumentSection(...)`:
```javascript
const fichaRuc = useDocumentSection({ storageKey: `docs_${ruc}_fichaRuc` });
const reporteTributario = useDocumentSection({ storageKey: `docs_${ruc}_reporteTributario` });
const declaracionesMensuales = useDocumentSection({ storageKey: `docs_${ruc}_declaracionesMensuales` });
// ... 14 hooks más llamados al mismo tiempo
```
Cada hook ejecuta un `useEffect` de montaje que llama inmediatamente a `GET /api/docs?key=...`, lo que satura la red enviando **17 solicitudes HTTP paralelas al backend al mismo tiempo**, incluso para secciones que el usuario no está viendo en ese momento.

#### Inconveniente B: Falta de Paginación en Backend y Frontend
En la ruta `GET /api/docs?key=docs_20601080428_compras`:
* El servidor hace `SELECT * FROM documents WHERE storageKey = ?` y devuelve **TODOS** los registros históricos de esa empresa sin importar cuántos existan (cientos o miles de facturas).
* El cliente recibe todo el arreglo de objetos en memoria y aplica un filtro visual por Año y Mes (`filteredList`).

---

### 2. Solución Propuesta Paso a Paso

#### Paso 1: Eliminar la Ráfaga de Peticiones (Carga Bajo Demanda / Lazy Loading)
* **Acción**: En lugar de cargar los documentos de las 17 secciones al abrir la empresa, se creará un endpoint liviano de resumen (`GET /api/docs/summary?ruc=...`) que solo devuelva los contadores o indicadores de notificaciones no leídas.
* **Resultado**: La carga de documentos completos solo se ejecutará **cuando el usuario seleccione la pestaña específica** (ej: al hacer clic en "Compras" o "Ventas").

#### Paso 2: Implementar Paginación en el Backend (`server.js`)
Actualizar la ruta `GET /api/docs` para aceptar los parámetros de filtrado y paginación desde la base de datos PostgreSQL:

```sql
-- Consulta con filtrado por año, mes y paginación limit/offset
SELECT * FROM documents 
WHERE storageKey = $1 
  AND ($2::text IS NULL OR year = $2)
  AND ($3::text IS NULL OR month = $3)
ORDER BY timestamp DESC
LIMIT $4 OFFSET $5;
```

**Respuesta de la API paginada:**
```json
{
  "list": [...],
  "total": 142,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "metadata": { ... }
}
```

#### Paso 3: Actualizar el Hook `useDocumentSection`
Agregar al estado del hook los parámetros `page` (por defecto `1`), `limit` (por defecto `20`), `total` y `totalPages`:
```javascript
const loadData = async () => {
    const { data, total, totalPages } = await docsApi.load(storageKey, {
        year: filterYear,
        month: filterMonth,
        page,
        limit
    });
    setList(data);
    setTotal(total);
    setTotalPages(totalPages);
};
```

#### Paso 4: Componente de Paginación en la Interfaz (`DocumentSection.jsx`)
Añadir una barra de navegación inferior en las tablas de Compras y Ventas con los controles:
* **Botón Anterior / Siguiente**
* **Indicador de página**: `Página 1 de 8 (142 registros totales)`
* **Selector de registros por página**: `20, 50, 100`

---

## 📌 Resumen de Acciones para Implementación

1. **Modificar `server.js`**:
   * Adaptar `GET /api/docs` con soporte para `year`, `month`, `page`, `limit` usando `COUNT(*)` y `LIMIT/OFFSET`.
2. **Optimizar `CompanyDashboard.jsx`**:
   * Convertir la carga de hooks en **Lazy/Bajo Demanda** según la pestaña activa `selectedPermission`.
3. **Actualizar `useDocumentSection.js` y `DocumentSection.jsx`**:
   * Incluir controles visuales de paginación y refrescar la petición al cambiar de página o filtro de fecha.
