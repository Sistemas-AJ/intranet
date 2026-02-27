import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env early so other modules can rely on its values.
dotenv.config();

// Derive __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Exported configuration values
export const PORT = process.env.PORT || 3000;

// Client files directory
export const CLIENTES_DIR = path.resolve(__dirname, 'clientes');

// Database directory and filename (defaults to database.sqlite to match existing).
export const DB_DIR = path.join(__dirname, 'data');
export const DB_PATH = path.join(DB_DIR, process.env.DB_FILE || 'database.sqlite');

// Distribution (frontend build) directory
export const DIST_DIR = path.join(__dirname, 'dist');

// Authentication defaults
export const ADMIN_USUARIO = process.env.ADMIN_USUARIO || 'AJADMINISTRADOR';
export const ADMIN_CONTRASENA = process.env.ADMIN_CONTRASENA || '197720';

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);

// CORS allowed origins list
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

// Database configuration.  By default we use the SQLite file defined above;
// setting DATABASE_URL to a PostgreSQL connection string will switch to a
// pool using that URL.  The rest of the code imports `USE_POSTGRES` or
// `DATABASE_URL` and adapts accordingly.
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const USE_POSTGRES = Boolean(process.env.DATABASE_URL);

