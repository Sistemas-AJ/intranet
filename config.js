import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env early so other modules can rely on its values.
dotenv.config();

// Derive __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Exported configuration values
export const PORT = process.env.PORT;

// Client files directory
export const CLIENTES_DIR = path.resolve(__dirname, 'clientes');

// Database directory and filename (defaults to database.sqlite to match existing).
export const DB_DIR = path.join(__dirname, 'data');
export const DB_PATH = path.join(DB_DIR, process.env.DB_FILE );

// Distribution (frontend build) directory
export const DIST_DIR = path.join(__dirname, 'dist');

// Authentication defaults
export const ADMIN_USUARIO = process.env.ADMIN_USUARIO ;
export const ADMIN_CONTRASENA = process.env.ADMIN_CONTRASENA;

// CORS allowed origins list
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS)
    .split(',')
    .map((o) => o.trim());
