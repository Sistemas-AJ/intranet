# Intranet AJ Sistemas - Sistema de Gestión Documental y Contable

Sistema web full-stack diseñado para la gestión documental, contable y tributaria entre la administración de **AJ Sistemas** y sus empresas clientes.

---

## 📌 Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Roles y Permisos](#roles-y-permisos)
5. [Modelo de Datos (Base de Datos)](#modelo-de-datos-base-de-datos)
6. [Configuración y Variables de Entorno](#configuración-y-variables-de-entorno)
7. [Instalación y Ejecución Local](#instalación-y-ejecución-local)
8. [Despliegue con Docker](#despliegue-con-docker)
9. [Seguridad](#seguridad)

---

## 🚀 Descripción General

La Intranet de AJ Sistemas permite organizar, centralizar y compartir documentación tributaria y contable estructurada por **Empresa (RUC)**, **Sección** (Compras, Ventas, Libros Registros, PLAME, etc.), **Año** y **Mes**.

### Funcionalidades Principales:
* **Panel Administrador**:
  * Gestión de empresas clientes (creación, edición y control de accesos).
  * Subida, organización y eliminación de documentos para cualquier cliente.
  * Comentarios y comunicación en tiempo real sobre los documentos subidos.
  * Asignación y visualización del Calendario Tributario.
  * Registro de auditoría (*history logs*).
* **Panel Cliente**:
  * Acceso mediante RUC y contraseña.
  * Visualización y descarga individual o masiva (en ZIP) de sus comprobantes y libros.
  * Subida de documentos dirigidos al equipo contable.
  * Control de documentos leídos/no leídos.
* **Visor y Descarga**:
  * Previsualización de archivos PDF integrados.
  * Descarga masiva de archivos comprimidos (.zip).

---

## 🛠️ Arquitectura y Tecnologías

El sistema utiliza una arquitectura desemparejada **SPA (Single Page Application)** + **API REST Express** + **PostgreSQL**:

* **Frontend**:
  * [React 19](https://react.dev/) + [Vite 7](https://vitejs.dev/)
  * [React Router DOM v7](https://reactrouter.com/) (Enrutamiento del cliente)
  * [Lucide React](https://lucide.dev/) (Iconografía moderna)
  * [Axios](https://axios-http.com/) con interceptores para inyección automática de Token JWT
  * [JSZip](https://stuk.github.io/jszip/) & [FileSaver](https://github.com/eligrey/FileSaver.js/) (Empaquetado de descargas ZIP)
* **Backend**:
  * [Node.js](https://nodejs.org/) (ES Modules)
  * [Express.js](https://expressjs.com/) (Servidor HTTP / API REST)
  * [Multer](https://github.com/expressjs/multer) (Procesamiento y carga de archivos)
  * [Helmet](https://helmetjs.github.io/) & [CORS](https://github.com/expressjs/cors) (Seguridad HTTP)
* **Base de Datos**:
  * [PostgreSQL](https://www.postgresql.org/) (driver `pg`)
* **Contenerización**:
  * Docker con imagen base `node:20-slim` y `docker-compose` con servicio de PostgreSQL 15.

---

## 📁 Estructura del Proyecto

```text
intranet/
├── config.js               # Centralización de variables de entorno y configuración
├── db.js                   # Conexión PostgreSQL (Pool pg) y helpers de consulta SQL
├── server.js               # Servidor API Express, middleware de auth, rutas y WebSocket/Log
├── package.json            # Dependencias y scripts del proyecto
├── vite.config.js          # Configuración de Vite y proxy de desarrollo (/api)
├── Dockerfile              # Construcción multi-stage para producción
├── docker-compose.yml      # Definición de servicios (Web API + Base de datos PostgreSQL)
├── public/                 # Archivos estáticos
├── clientes/               # Almacenamiento en disco de archivos subidos por RUC/Empresa
└── src/                    # Código fuente del Frontend (React)
    ├── App.jsx             # Componente raíz y definición de rutas
    ├── main.jsx            # Punto de entrada de React
    ├── api.js              # Cliente Axios configurado con el interceptor JWT
    ├── Login.jsx           # Vista de inicio de sesión
    ├── Dashboard.jsx       # Vista del Dashboard del Administrador
    ├── CompanyDashboard.jsx# Vista detallada de la empresa (Cliente / Admin)
    ├── CreateUserModal.jsx # Modal para registrar/editar empresas
    ├── components/         # Componentes modulares de interfaz
    │   ├── CompaniesSidebar.jsx   # Barra lateral de navegación entre empresas
    │   ├── DocumentSection.jsx    # Módulo de gestión y visualización de documentos
    │   ├── LibrosRegistrosSection.jsx # Subsección de Libros y Registros Contables
    │   ├── PlameSection.jsx       # Subsección de planilla PLAME
    │   └── TaxCalendarModal.jsx   # Modal de Calendario Tributario
    └── hooks/
        └── useDocumentSection.js  # Hook personalizado para manejo de estado de documentos
```

---

## 👥 Roles y Permisos

1. **`admin`**:
   * Acceso completo al sistema, lista global de empresas, configuración de usuarios, auditoría y carga masiva de archivos.
2. **`client`**:
   * Acceso restringido únicamente a la información, documentos y secciones pertenecientes a su propio RUC.

---

## 🗄️ Modelo de Datos (Base de Datos)

El esquema relacional en PostgreSQL administra las siguientes tablas principales:

* **`companies`**: Datos de acceso y perfiles de empresas/administradores (RUC, Razón Social, Dirección, Usuario, Contraseña en Bcrypt, Rol, Permisos).
* **`documents`**: Registro de archivos almacenados (ID, RUC, Sección, Año, Mes, Nombre, Ruta URL, Tipo, Comentarios, Estado de lectura, etc.).
* **`metadata`**: Estado de notificaciones (leídos/no leídos por cliente y admin) por carpeta/sección.
* **`history_logs`**: Registro de auditoría de acciones ejecutadas en la plataforma (subida/eliminación de documentos, creación de usuarios, etc.).

---

## ⚙️ Configuración y Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en el siguiente formato:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos PostgreSQL (Obligatorio)
DATABASE_URL=postgres://usuario:password@localhost:5432/intranet_db

# Seguridad JWT y Bcrypt
JWT_SECRET=super_secret_jwt_key_cambiar_en_produccion
SALT_ROUNDS=10

# Credenciales de Administrador por Defecto
ADMIN_USUARIO=AJADMINISTRADOR
ADMIN_CONTRASENA=197720

# CORS (Orígenes permitidos separados por coma)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# API URL para el proxy de Vite en desarrollo
VITE_API_URL=http://localhost:3000
```

---

## 💻 Instalación y Ejecución Local

### 1. Requisitos Previos
* Node.js v18+ 
* PostgreSQL v14+ activo y con la base de datos creada.

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el Backend (Express)
```bash
npm run start
# o para desarrollo continuo:
node server.js
```
*El backend se iniciará en `http://localhost:3000` y creará las tablas automáticamente si no existen.*

### 4. Iniciar el Frontend (Vite)
En otra ventana de terminal:
```bash
npm run dev
```
*El frontend estará disponible en `http://localhost:5173`. Las llamadas a `/api` se redirigen automáticamente al backend por el proxy de Vite.*

---

## 🐳 Despliegue con Docker

El proyecto incluye un entorno listo para producción usando Docker Compose con Node 20 y PostgreSQL 15:

```bash
# Construir la imagen y levantar los contenedores
docker-compose up --build -d
```

* El servicio web estará escuchando en el puerto `3500` por defecto (`http://localhost:3500`).
* La carpeta `./clientes` se monta como volumen persistente para no perder los archivos físicos almacenados.
* La base de datos guarda sus datos en el volumen `pgdata`.

---

## 🔒 Seguridad Implementada

* **Autenticación JWT**: Los usuarios obtienen un token con firma expirable al iniciar sesión, enviado vía encabezado `Authorization: Bearer <token>`.
* **Cifrado de Contraseñas**: Uso de `bcrypt` para el hash seguro de claves.
* **Seguridad de Archivos y Consultas SQL**: Consultas parametrizadas en `db.js` para prevenir inyección SQL. Sanitización de nombres de rutas y archivos para evitar *Directory Traversal*.
* **Encabezados HTTP Seguros**: Protección activada mediante `Helmet` (CSP, HSTS, X-Frame-Options).
