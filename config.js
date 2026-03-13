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

// Distribution (frontend build) directory
export const DIST_DIR = path.join(__dirname, 'dist');

// Authentication defaults
export const ADMIN_USUARIO = process.env.ADMIN_USUARIO || 'AJADMINISTRADOR';
export const ADMIN_CONTRASENA = process.env.ADMIN_CONTRASENA || '197720';

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);

// CORS allowed origins list
const normalizeOrigin = (origin) => {
    const trimmed = (origin || '').trim();
    if (!trimmed) return '';
    return trimmed.replace(/\/+$/, '');
};

export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

// Database configuration. PostgreSQL is required in all environments.
export const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    throw new Error('DATABASE_URL es obligatorio. La aplicacion no usa SQLite.');
}
