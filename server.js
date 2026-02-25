import express from 'express';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import multer from 'multer';
import helmet from 'helmet';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── APP ──────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3000;

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

// CORS: only allow your own frontend origin in production
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

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

app.use(express.json());

// ── PATHS & DATABASE ─────────────────────────────────────────────────────────

const CLIENTES_DIR = path.resolve(__dirname, 'clientes');
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'database.sqlite');
const DIST_DIR = path.join(__dirname, 'dist');

if (!fs.existsSync(CLIENTES_DIR)) fs.mkdirSync(CLIENTES_DIR, { recursive: true });
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
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
    usuario TEXT,
    contrasena TEXT,
    role TEXT,
    permissions TEXT
  );
`);

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
    return (req, res, next) => {
        const ruc = req.headers['x-ruc'] || req.query.ruc || req.body?.ruc;
        const role = (req.headers['x-role'] || '').toLowerCase();

        if (!ruc || !role) {
            return res.status(401).json({ error: 'Autenticación requerida (falta x-ruc o x-role)' });
        }

        // Verify against the DB — never trust just the header alone
        const company = db.prepare('SELECT role FROM companies WHERE ruc = ?').get(String(ruc));
        if (!company) {
            return res.status(401).json({ error: 'Empresa no encontrada' });
        }
        const dbRole = (company.role || 'client').toLowerCase();

        if (!roles.includes(dbRole)) {
            return res.status(403).json({
                error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}. Tu rol: ${dbRole}`,
            });
        }

        // Attach for downstream handlers
        req.userRole = dbRole;
        req.userRuc = String(ruc);
        next();
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

// ── API ROUTES ───────────────────────────────────────────────────────────────

// -- Companies (admin only for write, read open for login flow) --

app.get('/api/companies', (req, res) => {
    const ruc = req.query.ruc;
    try {
        if (ruc) {
            const company = db.prepare('SELECT * FROM companies WHERE ruc = ?').get(ruc);
            if (company) {
                company.permissions = JSON.parse(company.permissions || '{}');
                res.json(company);
            } else {
                res.status(404).json({ error: 'No encontrado' });
            }
        } else {
            const list = db.prepare('SELECT * FROM companies').all();
            list.forEach((c) => { c.permissions = JSON.parse(c.permissions || '{}'); });
            res.json(list);
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/companies', requireRole('admin'), (req, res) => {
    const list = Array.isArray(req.body) ? req.body : (req.body.companies ? req.body.companies : [req.body]);
    try {
        const insert = db.prepare(`
      INSERT INTO companies (ruc, razonSocial, usuario, contrasena, role, permissions)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(ruc) DO UPDATE SET
        razonSocial = excluded.razonSocial,
        usuario     = excluded.usuario,
        contrasena  = excluded.contrasena,
        role        = excluded.role,
        permissions = excluded.permissions
    `);
        const tx = db.transaction((items) => {
            for (const item of items) {
                if (!item.ruc) continue;
                insert.run(
                    String(item.ruc), item.razonSocial, item.usuario,
                    item.contrasena, item.role || 'client',
                    JSON.stringify(item.permissions || {})
                );
            }
        });
        tx(list);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/companies/:ruc', requireRole('admin'), (req, res) => {
    try {
        db.prepare('DELETE FROM companies WHERE ruc = ?').run(req.params.ruc);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// -- History (admin only) --

app.get('/api/history', requireRole('admin'), (req, res) => {
    try {
        const logs = db.prepare('SELECT * FROM history_logs ORDER BY id DESC LIMIT 100').all();
        res.json(logs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// -- File Upload (admin & client) --

app.post('/api/upload', requireRole('admin', 'client'), upload.array('file'), (req, res) => {
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

            fs.renameSync(file.path, targetPath); // atomic move (same FS)

            const doc = {
                id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                storageKey, ruc, section, year, month,
                name: file.originalname,
                url: publicUrl,
                type: extraData.type || 'Documento',
                description: extraData.description || '',
                isNonDeducible: extraData.isNonDeducible ? 1 : 0,
                uploadedBy: extraData.uploadedBy || req.userRole,
                seenByAdmin: extraData.uploadedBy === 'client' ? 0 : 1,
                seenByClient: extraData.uploadedBy === 'client' ? 1 : 0,
                timestamp: new Date().toISOString(),
            };

            db.prepare(`
        INSERT INTO documents
          (id, storageKey, ruc, section, year, month, name, url, type, description,
           isNonDeducible, uploadedBy, seenByAdmin, seenByClient, timestamp)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
                doc.id, doc.storageKey, doc.ruc, doc.section, doc.year, doc.month,
                doc.name, doc.url, doc.type, doc.description,
                doc.isNonDeducible, doc.uploadedBy, doc.seenByAdmin, doc.seenByClient, doc.timestamp
            );

            if (doc.uploadedBy === 'client') {
                const meta = db.prepare('SELECT * FROM metadata WHERE storageKey = ?').get(storageKey);
                const events = meta ? JSON.parse(meta.events || '[]') : [];
                events.push({
                    id: Date.now(),
                    message: `${extraData.companyName || ruc} subió: ${file.originalname}`,
                    timestamp: doc.timestamp,
                });
                db.prepare(`
          INSERT INTO metadata (storageKey, unreadForAdmin, unreadForClient, events)
          VALUES (?, 1, 0, ?)
          ON CONFLICT(storageKey) DO UPDATE SET unreadForAdmin = 1, events = ?
        `).run(storageKey, JSON.stringify(events), JSON.stringify(events));
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

app.get('/api/docs', requireRole('admin', 'client'), (req, res) => {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'Falta key' });

    // Clients can only read their own storage keys (key format: ruc_section)
    if (req.userRole === 'client') {
        const keyRuc = key.split('_')[0];
        if (keyRuc !== req.userRuc) {
            return res.status(403).json({ error: 'Acceso denegado a documentos de otro cliente' });
        }
    }

    try {
        const docs = db.prepare('SELECT * FROM documents WHERE storageKey = ?').all(key);
        const meta = db.prepare('SELECT * FROM metadata WHERE storageKey = ?').get(key);
        res.json({
            list: docs.map((d) => ({
                ...d,
                isNonDeducible: d.isNonDeducible === 1,
                seenByAdmin: d.seenByAdmin === 1,
                seenByClient: d.seenByClient === 1,
            })),
            metadata: meta
                ? {
                    unreadForAdmin: meta.unreadForAdmin === 1,
                    unreadForClient: meta.unreadForClient === 1,
                    events: JSON.parse(meta.events || '[]'),
                }
                : { unreadForAdmin: false, unreadForClient: false, events: [] },
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// -- Delete doc(s) --

app.delete('/api/docs', requireRole('admin', 'client'), (req, res) => {
    const id = req.query.id;
    const key = req.query.key;

    // Clients may only delete their own uploads
    if (req.userRole === 'client') {
        if (id) {
            const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
            if (doc && doc.ruc !== req.userRuc) {
                return res.status(403).json({ error: 'No puedes eliminar archivos de otro cliente' });
            }
            if (doc && doc.uploadedBy !== 'client') {
                return res.status(403).json({ error: 'Los clientes no pueden eliminar archivos subidos por el administrador' });
            }
        } else if (key) {
            const keyRuc = key.split('_')[0];
            if (keyRuc !== req.userRuc) {
                return res.status(403).json({ error: 'Acceso denegado' });
            }
        }
    }

    try {
        if (id) {
            const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
            if (doc) {
                const p = path.join(__dirname, doc.url.startsWith('/') ? doc.url.substring(1) : doc.url);
                if (fs.existsSync(p)) { fs.unlinkSync(p); removeEmptyParents(p, CLIENTES_DIR); }
                db.prepare('DELETE FROM documents WHERE id = ?').run(id);
            }
        } else if (key) {
            const docs = db.prepare('SELECT * FROM documents WHERE storageKey = ?').all(key);
            for (const doc of docs) {
                const p = path.join(__dirname, doc.url.startsWith('/') ? doc.url.substring(1) : doc.url);
                if (fs.existsSync(p)) { fs.unlinkSync(p); removeEmptyParents(p, CLIENTES_DIR); }
            }
            db.prepare('DELETE FROM documents WHERE storageKey = ?').run(key);
        }
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// -- Update doc fields --

app.post('/api/docs/update', requireRole('admin'), (req, res) => {
    const id = req.query.id;
    try {
        const entries = Object.entries(req.body);
        if (id && entries.length > 0) {
            const set = entries.map(([k]) => `${k} = ?`).join(', ');
            const vals = entries.map(([_, v]) => (typeof v === 'boolean' ? (v ? 1 : 0) : v));
            db.prepare(`UPDATE documents SET ${set} WHERE id = ?`).run(...vals, id);
        }
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// -- Metadata update --

app.post('/api/docs-metadata', requireRole('admin', 'client'), (req, res) => {
    try {
        const { key, unreadForAdmin, unreadForClient, clearEvents } = req.body;
        db.prepare(`
      UPDATE metadata
      SET
        unreadForAdmin  = COALESCE(?, unreadForAdmin),
        unreadForClient = COALESCE(?, unreadForClient),
        events = CASE WHEN ? = 1 THEN '[]' ELSE events END
      WHERE storageKey = ?
    `).run(
            unreadForAdmin === undefined ? null : (unreadForAdmin ? 1 : 0),
            unreadForClient === undefined ? null : (unreadForClient ? 1 : 0),
            clearEvents ? 1 : 0,
            key
        );
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── STATIC FILES ─────────────────────────────────────────────────────────────

app.use('/clientes', express.static(CLIENTES_DIR));
app.use(express.static(DIST_DIR));

// SPA Fallback
app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// ── ERROR HANDLER ────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[Server Error]', err.message);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Error interno del servidor' });
});

// ── START ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`✅ Servidor listo en http://localhost:${PORT}  [modo: ${process.env.NODE_ENV || 'development'}]`);
});
