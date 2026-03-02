import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import helmet from 'helmet';
import cors from 'cors';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// load configuration constants (dotenv is handled inside config.js)
import {
  PORT,
  CLIENTES_DIR,
  DB_DIR,
  DB_PATH,
  DATABASE_URL,
  DIST_DIR,
  ADMIN_USUARIO,
  ADMIN_CONTRASENA,
  ALLOWED_ORIGINS,
  JWT_SECRET,
  SALT_ROUNDS,
  USE_POSTGRES,
} from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── APP ──────────────────────────────────────────────────────────────────────

const app = express();
// PORT is imported from config.js, which already handles process.env fallback

// ── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────

// Helmet: sets secure HTTP headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'blob:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameSrc: ["'self'"],      // allow PDF iframe previews served by self
            },
        },
        crossOriginEmbedderPolicy: false, // needed for PDF viewer
    })
);

// CORS: allowed origins are configured via config.js/.env (imported above)

app.use(
    cors({
        origin: (origin, callback) => {
            // permit server-to-server (no origin) and listed origins
            if (!origin || ALLOWED_ORIGINS.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin ${origin} not allowed`));
            }
        },
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-role', 'x-ruc'],
        credentials: true,
    })
);

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── PATHS & DATABASE ─────────────────────────────────────────────────────────

// directories and file paths are defined in config.js so they can be
// controlled via a single .env / config file rather than sprinkled
// throughout the codebase.

if (!fs.existsSync(CLIENTES_DIR)) fs.mkdirSync(CLIENTES_DIR, { recursive: true });
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

import db, { exec } from './db.js';

async function initDb() {
    if (USE_POSTGRES) {
        // create tables with syntax acceptable to Postgres; we use SERIAL
        // for the auto-incrementing primary key and BOOLEAN for bit flags.
        await exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    storageKey TEXT,
    ruc TEXT,
    section TEXT,
    year TEXT,
    month TEXT,
    name TEXT,
    url TEXT,
    type TEXT,
    description TEXT,
    adminComment TEXT,
    isNonDeducible BOOLEAN,
    uploadedBy TEXT,
    seenByAdmin BOOLEAN,
    seenByClient BOOLEAN,
    timestamp TEXT
  );
  CREATE TABLE IF NOT EXISTS metadata (
    storageKey TEXT PRIMARY KEY,
    unreadForAdmin BOOLEAN,
    unreadForClient BOOLEAN,
    events TEXT
  );
  CREATE TABLE IF NOT EXISTS history_logs (
    id SERIAL PRIMARY KEY,
    action TEXT,
    details TEXT,
    timestamp TEXT
  );
  CREATE TABLE IF NOT EXISTS companies (
    ruc TEXT PRIMARY KEY,
    razonSocial TEXT,
    direccion TEXT,
    usuario TEXT,
    contrasena TEXT,
    role TEXT,
    permissions TEXT
  );
`);
    } else {
        // existing sqlite initialization
        await exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    storageKey TEXT,
    ruc TEXT,
    section TEXT,
    year TEXT,
    month TEXT,
    name TEXT,
    url TEXT,
    type TEXT,
    description TEXT,
    adminComment TEXT,
    isNonDeducible INTEGER,
    uploadedBy TEXT,
    seenByAdmin INTEGER,
    seenByClient INTEGER,
    timestamp TEXT
  );
  CREATE TABLE IF NOT EXISTS metadata (
    storageKey TEXT PRIMARY KEY,
    unreadForAdmin INTEGER,
    unreadForClient INTEGER,
    events TEXT
  );
  CREATE TABLE IF NOT EXISTS history_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    details TEXT,
    timestamp TEXT
  );
  CREATE TABLE IF NOT EXISTS companies (
    ruc TEXT PRIMARY KEY,
    razonSocial TEXT,
    direccion TEXT,
    usuario TEXT,
    contrasena TEXT,
    role TEXT,
    permissions TEXT
  );
`);
    }
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function sanitize(name) {
    return (name || 'SIN_NOMBRE').replace(/[<>:"/\\|?*]/g, '_').trim() || 'SIN_NOMBRE';
}

function removeEmptyParents(filePath, stopDir) {
    let currentDir = path.dirname(filePath);
    while (currentDir !== stopDir && currentDir.length > stopDir.length) {
        if (fs.existsSync(currentDir) && fs.readdirSync(currentDir).length === 0) {
            fs.rmdirSync(currentDir);
            currentDir = path.dirname(currentDir);
        } else {
            break;
        }
    }
}

function moveFileAcrossDevices(sourcePath, targetPath) {
    try {
        fs.renameSync(sourcePath, targetPath);
    } catch (error) {
        if (error?.code !== 'EXDEV') throw error;
        fs.copyFileSync(sourcePath, targetPath);
        fs.unlinkSync(sourcePath);
    }
}

function toDbBoolean(value) {
    return USE_POSTGRES ? Boolean(value) : (value ? 1 : 0);
}

function fromDbBoolean(value) {
    return value === true || value === 1;
}

function parseJsonField(value, fallback) {
    if (!value) return fallback;
    if (typeof value !== 'string') return value;
    return JSON.parse(value);
}

function clientDeleteError(doc, userRuc) {
    if (!doc) return null;
    if (doc.ruc !== userRuc) {
        return 'No puedes eliminar archivos de otro cliente';
    }
    if (doc.uploadedBy !== 'client') {
        return 'Los clientes no pueden eliminar archivos subidos por el administrador';
    }
    return null;
}

async function deleteDocumentRecord(doc) {
    if (!doc) return;
    const filePath = path.join(__dirname, doc.url.startsWith('/') ? doc.url.substring(1) : doc.url);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        removeEmptyParents(filePath, CLIENTES_DIR);
    }
    await db.run('DELETE FROM documents WHERE id = ?', [doc.id]);
}

// ── ROLE MIDDLEWARE ──────────────────────────────────────────────────────────
/**
 * requireRole(...roles)
 *
 * Reads the caller's role from the request header  x-role  (set by the React
 * frontend after login) and from the DB to verify it has not been tampered.
 * Only requests whose DB role matches one of the allowed roles pass through.
 *
 * Header  x-ruc   must also be present so we can look up the company.
 *
 * Usage:
 *   router.delete('/api/docs', requireRole('admin'), handler)
 *   router.post('/api/upload', requireRole('admin', 'client'), handler)
 */
function requireRole(...roles) {
    return async (req, res, next) => {
        try {
            let role;
            let ruc;
            if (req.user) {
                role = req.user.role;
                ruc = req.user.ruc;
            } else {
                role = (req.headers['x-role'] || '').toLowerCase();
                ruc = req.headers['x-ruc'] || req.query.ruc || req.body?.ruc;
            }

            if (!ruc || !role) {
                return res.status(401).json({ error: 'Autenticación requerida' });
            }

            const company = await db.get('SELECT role FROM companies WHERE ruc = ?', [String(ruc)]);
            if (!company) {
                return res.status(401).json({ error: 'Empresa no encontrada' });
            }
            const dbRole = (company.role || 'client').toLowerCase();

            if (!roles.includes(dbRole)) {
                return res.status(403).json({
                    error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}. Tu rol: ${dbRole}`,
                });
            }

            req.userRole = dbRole;
            req.userRuc = String(ruc);
            next();
        } catch (error) {
            next(error);
        }
    };
}

// ── MULTER (file upload) ──────────────────────────────────────────────────────

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
            // Temp folder; files are moved to their final path in the route handler
            const tmp = path.join(__dirname, 'tmp_uploads');
            if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
            cb(null, tmp);
        },
        filename: (_req, file, cb) => {
            cb(null, `${Date.now()}_${sanitize(file.originalname)}`);
        },
    }),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB per file
        files: 20,                   // max 20 files per request
    },
    fileFilter: (_req, file, cb) => {
        // Allow common document & image types
        const ALLOWED_MIME = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/webp',
            'text/plain',
            'text/csv',
        ];
        if (ALLOWED_MIME.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
        }
    },
});

// ── SEED ADMIN ───────────────────────────────────────────────────────────────
async function seedAdmin() {
    const hash = bcrypt.hashSync(ADMIN_CONTRASENA, SALT_ROUNDS);
    await db.run(`
    INSERT INTO companies (ruc, razonSocial, direccion, usuario, contrasena, role, permissions)
    VALUES ('ADMIN', 'Administrador', '', ?, ?, 'admin', '{}')
    ON CONFLICT(ruc) DO UPDATE SET
      usuario    = excluded.usuario,
      contrasena = excluded.contrasena
  `, [ADMIN_USUARIO, hash]);
}

// ── API ROUTES ───────────────────────────────────────────────────────────────

// -- Authentication helpers ------------------------------------------------

function generateToken(user) {
    // include minimal info; role/ruc allow authorization checks later
    return jwt.sign({ ruc: user.ruc, role: user.role || 'client', usuario: user.usuario }, JWT_SECRET, {
        expiresIn: '8h',
    });
}

function authenticateToken(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ error: 'Token requerido' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Formato de token inválido' });
    }
    try {
        const payload = jwt.verify(parts[1], JWT_SECRET);
        req.user = payload;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// -- Login (public — validates credentials, returns safe user object + token) --

app.post('/api/login', async (req, res) => {
    const { usuario, contrasena } = req.body || {};
    if (!usuario || !contrasena) {
        return res.status(400).json({ error: 'Faltan credenciales' });
    }
    try {
        const user = await db.get('SELECT * FROM companies WHERE usuario = ?', [String(usuario)]);
        if (!user) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        if (!bcrypt.compareSync(contrasena, user.contrasena)) {
            // if stored password is plain text (migration from older version),
            // allow login and rehash automatically
            if (user.contrasena === contrasena) {
                const newHash = bcrypt.hashSync(contrasena, SALT_ROUNDS);
                await db.run('UPDATE companies SET contrasena = ? WHERE ruc = ?', [newHash, user.ruc]);
            } else {
                return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            }
        }

        const safe = {
            ruc: user.ruc,
            razonSocial: user.razonSocial,
            usuario: user.usuario,
            role: user.role || 'client',
            permissions: parseJsonField(user.permissions, {}),
        };
        const token = generateToken(user);
        res.json({ ok: true, user: safe, token });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// -- Companies (admin only for write; read is public but strips contrasena) --

// Helper: remove password before sending to client
function safeCompany(c) {
    const { contrasena: _omit, ...safe } = c;
    safe.permissions = parseJsonField(safe.permissions, {});
    return safe;
}

// NOTE: GET /api/companies used to be public, but exposing a list of
// all firms without authentication is a privacy risk.  Now the route is
// protected by authenticateToken (see placement below) and applies a few
// extra checks:
//   * clients may only fetch their own record
//   * listing all companies requires admin role

// the actual handler remains defined later after the global middleware

// require token on all /api requests (login is defined earlier and
// therefore remains open).  placing the middleware here means that every
// handler declared after this line will receive a valid JWT payload in
// `req.user`.
app.use('/api', authenticateToken);

// authenticated company listing
app.get('/api/companies', async (req, res) => {
    const ruc = req.query.ruc;
    try {
        if (ruc) {
            // clients may only look up their own RUC
            if (req.user.role === 'client' && req.user.ruc !== ruc) {
                return res.status(403).json({ error: 'No autorizado para ese RUC' });
            }
            const company = await db.get('SELECT * FROM companies WHERE ruc = ?', [ruc]);
            if (company) {
                res.json(safeCompany(company));
            } else {
                res.status(404).json({ error: 'No encontrado' });
            }
        } else {
            // only admin may list all companies
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Solo administradores pueden listar todas las empresas' });
            }
            const list = await db.all('SELECT * FROM companies');
            res.json(list.map(safeCompany));
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/companies', requireRole('admin'), async (req, res) => {
    const list = Array.isArray(req.body) ? req.body : (req.body.companies ? req.body.companies : [req.body]);
    try {
        const tx = db.transaction(async (txDb, items) => {
            for (const item of items) {
                if (!item.ruc) continue;
                const hashed = item.contrasena
                    ? bcrypt.hashSync(String(item.contrasena), SALT_ROUNDS)
                    : undefined;
                await txDb.run(`
                  INSERT INTO companies (ruc, razonSocial, direccion, usuario, contrasena, role, permissions)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(ruc) DO UPDATE SET
                    razonSocial = excluded.razonSocial,
                    direccion   = excluded.direccion,
                    usuario     = excluded.usuario,
                    contrasena  = COALESCE(NULLIF(excluded.contrasena, ''), companies.contrasena),
                    role        = excluded.role,
                    permissions = excluded.permissions
                `, [
                    String(item.ruc),
                    item.razonSocial,
                    item.direccion || '',
                    item.usuario,
                    hashed || item.contrasena || '',
                    item.role || 'client',
                    JSON.stringify(item.permissions || {}),
                ]);
            }
        });
        await tx(list);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/companies/:ruc', requireRole('admin'), async (req, res) => {
    try {
        await db.run('DELETE FROM companies WHERE ruc = ?', [req.params.ruc]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// -- History (admin only) --

app.get('/api/history', requireRole('admin'), async (req, res) => {
    try {
        const logs = await db.all('SELECT * FROM history_logs ORDER BY id DESC LIMIT 100');
        res.json(logs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// -- File Upload (admin & client) --

app.post('/api/upload', requireRole('admin', 'client'), upload.array('file'), async (req, res) => {
    try {
        const { ruc, section, year, month, storageKey } = req.body;
        const extraData = JSON.parse(req.body.extraData || '{}');
        const uploadedFiles = req.files || [];

        if (!ruc || !section || !year || !month || !storageKey) {
            return res.status(400).json({ error: 'Faltan campos requeridos (ruc, section, year, month, storageKey)' });
        }

        // Clients may only upload to their own RUC
        if (req.userRole === 'client' && req.userRuc !== String(ruc)) {
            return res.status(403).json({ error: 'No puedes subir archivos a otro cliente' });
        }

        const results = [];

        for (const file of uploadedFiles) {
            const targetDir = path.join(CLIENTES_DIR, ruc, section, year, month);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            const timestamp = Date.now();
            const fileName = `${ruc}_${section}_${timestamp}_${sanitize(file.originalname)}`;
            const targetPath = path.join(targetDir, fileName);
            const publicUrl = `/clientes/${ruc}/${section}/${year}/${month}/${fileName}`.replace(/\\/g, '/');

            moveFileAcrossDevices(file.path, targetPath);

            const doc = {
                id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                storageKey, ruc, section, year, month,
                name: file.originalname,
                url: publicUrl,
                type: extraData.type || 'Documento',
                description: extraData.description || '',
                isNonDeducible: toDbBoolean(extraData.isNonDeducible),
                uploadedBy: extraData.uploadedBy || req.userRole,
                seenByAdmin: toDbBoolean(extraData.uploadedBy !== 'client'),
                seenByClient: toDbBoolean(extraData.uploadedBy === 'client'),
                timestamp: new Date().toISOString(),
            };

            await db.run(`
        INSERT INTO documents
          (id, storageKey, ruc, section, year, month, name, url, type, description,
           isNonDeducible, uploadedBy, seenByAdmin, seenByClient, timestamp)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
                doc.id, doc.storageKey, doc.ruc, doc.section, doc.year, doc.month,
                doc.name, doc.url, doc.type, doc.description,
                doc.isNonDeducible, doc.uploadedBy, doc.seenByAdmin, doc.seenByClient, doc.timestamp,
            ]);

            if (doc.uploadedBy === 'client') {
                const meta = await db.get('SELECT * FROM metadata WHERE storageKey = ?', [storageKey]);
                const events = meta ? parseJsonField(meta.events, []) : [];
                events.push({
                    id: Date.now(),
                    message: `${extraData.companyName || ruc} subió: ${file.originalname}`,
                    timestamp: doc.timestamp,
                });
                await db.run(`
          INSERT INTO metadata (storageKey, unreadForAdmin, unreadForClient, events)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(storageKey) DO UPDATE SET unreadForAdmin = ?, events = ?
        `, [
                    storageKey,
                    toDbBoolean(true),
                    toDbBoolean(false),
                    JSON.stringify(events),
                    toDbBoolean(true),
                    JSON.stringify(events),
                ]);
            }

            results.push(doc);
        }

        res.json({ ok: true, documents: results });
    } catch (e) {
        // Clean up any temp files left on error
        (req.files || []).forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        res.status(500).json({ error: e.message });
    }
});

// -- Docs read (admin & client) --

app.get('/api/docs', requireRole('admin', 'client'), async (req, res) => {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'Falta key' });

    // Clients can only read their own storage keys. the frontend prefixes
    // every key with "docs_" (eg. "docs_12345_compras"), so we must strip
    // that before extracting the RUC. otherwise key.split('_')[0] will return
    // "docs" and the check always fails.
    if (req.userRole === 'client') {
        const parts = key.split('_');
        // if the first segment is the literal prefix, take the second chunk
        const keyRuc = parts[0] === 'docs' ? parts[1] : parts[0];
        if (keyRuc !== req.userRuc) {
            return res.status(403).json({ error: 'Acceso denegado a documentos de otro cliente' });
        }
    }

    try {
        const docs = await db.all('SELECT * FROM documents WHERE storageKey = ?', [key]);
        const meta = await db.get('SELECT * FROM metadata WHERE storageKey = ?', [key]);
        res.json({
            list: docs.map((d) => ({
                ...d,
                isNonDeducible: fromDbBoolean(d.isNonDeducible),
                seenByAdmin: fromDbBoolean(d.seenByAdmin),
                seenByClient: fromDbBoolean(d.seenByClient),
            })),
            metadata: meta
                ? {
                    unreadForAdmin: fromDbBoolean(meta.unreadForAdmin),
                    unreadForClient: fromDbBoolean(meta.unreadForClient),
                    events: parseJsonField(meta.events, []),
                }
                : { unreadForAdmin: false, unreadForClient: false, events: [] },
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// -- Delete doc(s) --

app.delete('/api/docs', requireRole('admin', 'client'), async (req, res) => {
    const id = req.query.id;
    const key = req.query.key;

    try {
        if (req.userRole === 'client') {
            if (id) {
                const doc = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
                const error = clientDeleteError(doc, req.userRuc);
                if (error) {
                    return res.status(403).json({ error });
                }
            } else if (key) {
                const parts = key.split('_');
                const keyRuc = parts[0] === 'docs' ? parts[1] : parts[0];
                if (keyRuc !== req.userRuc) {
                    return res.status(403).json({ error: 'Acceso denegado' });
                }
            }
        }

        if (id) {
            const doc = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
            await deleteDocumentRecord(doc);
        } else if (key) {
            const docs = await db.all('SELECT * FROM documents WHERE storageKey = ?', [key]);
            for (const doc of docs) {
                await deleteDocumentRecord(doc);
            }
        }
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/docs/bulk-delete', requireRole('admin', 'client'), async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((id) => String(id)).filter(Boolean) : [];

    if (ids.length === 0) {
        return res.status(400).json({ error: 'Faltan ids para eliminar' });
    }

    try {
        const docs = [];
        for (const id of ids) {
            const doc = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
            if (doc) docs.push(doc);
        }

        if (req.userRole === 'client') {
            for (const doc of docs) {
                const error = clientDeleteError(doc, req.userRuc);
                if (error) {
                    return res.status(403).json({ error });
                }
            }
        }

        for (const doc of docs) {
            await deleteDocumentRecord(doc);
        }

        res.json({ ok: true, deletedIds: docs.map((doc) => doc.id) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// -- Update doc fields --

app.post('/api/docs/update', requireRole('admin'), async (req, res) => {
    const id = req.query.id;
    try {
        const entries = Object.entries(req.body);
        if (id && entries.length > 0) {
            // whitelist known document columns to avoid injection via keys
            const allowed = new Set([
                'ruc','section','year','month','name','url','type',
                'description','adminComment','isNonDeducible','uploadedBy',
                'seenByAdmin','seenByClient','timestamp',
            ]);
            const safe = entries.filter(([k]) => allowed.has(k));
            if (safe.length === 0) {
                return res.status(400).json({ error: 'No fields actualizables proporcionados' });
            }
            const set = safe.map(([k]) => `${k} = ?`).join(', ');
            const vals = safe.map(([_, v]) => (typeof v === 'boolean' ? toDbBoolean(v) : v));
            await db.run(`UPDATE documents SET ${set} WHERE id = ?`, [...vals, id]);
        }
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// -- Metadata update --

app.post('/api/docs-metadata', requireRole('admin', 'client'), async (req, res) => {
    try {
        const { key, unreadForAdmin, unreadForClient, clearEvents } = req.body;
        await db.run(`
      UPDATE metadata
      SET
        unreadForAdmin  = COALESCE(?, unreadForAdmin),
        unreadForClient = COALESCE(?, unreadForClient),
        events = CASE WHEN ? THEN '[]' ELSE events END
      WHERE storageKey = ?
    `, [
            unreadForAdmin === undefined ? null : toDbBoolean(unreadForAdmin),
            unreadForClient === undefined ? null : toDbBoolean(unreadForClient),
            USE_POSTGRES ? Boolean(clearEvents) : (clearEvents ? 1 : 0),
            key,
        ]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── STATIC FILES ─────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production' || fs.existsSync(DIST_DIR)) {
    app.use('/clientes', express.static(CLIENTES_DIR));
    app.use(express.static(DIST_DIR));

    // SPA Fallback
    app.get('*', (_req, res) => {
        res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
} else {
    // In development the front-end is served by Vite; avoid 404 noise
    console.log('Skipping static file middleware (no dist directory)');
}

// ── ERROR HANDLER ────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[Server Error]', err.message);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Error interno del servidor' });
});

// ── START ─────────────────────────────────────────────────────────────────────

async function startServer() {
    try {
        await initDb();
        await seedAdmin();
        app.listen(PORT, () => {
            console.log(`✅ Servidor listo en http://localhost:${PORT}  [modo: ${process.env.NODE_ENV || 'development'}]`);
            console.log(`   db: ${USE_POSTGRES ? DATABASE_URL : DB_PATH}`);
        });
    } catch (error) {
        console.error('failed to initialize database', error);
        process.exit(1);
    }
}

startServer();
