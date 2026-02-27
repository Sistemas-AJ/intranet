import express from 'express';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
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
  DIST_DIR,
  ADMIN_USUARIO,
  ADMIN_CONTRASENA,
  ALLOWED_ORIGINS,
  JWT_SECRET,
  SALT_ROUNDS,
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

const db = new Database(DB_PATH);
// we will use parameterised/prepared statements ("?" placeholders) everywhere
// below; better-sqlite3 ensures inputs are bound rather than concatenated,
// which effectively prevents SQL injection.  Do **not** build dynamic SQL
// by string interpolation with user-supplied data.
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
        // prefer JWT if present
        let role, ruc;
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

// ── SEED ADMIN ───────────────────────────────────────────────────────────────
// Guarantees the admin account always exists in the DB.  Passwords are
// stored hashed using bcrypt.
(function seedAdmin() {
    const hash = bcrypt.hashSync(ADMIN_CONTRASENA, SALT_ROUNDS);
    db.prepare(`
    INSERT INTO companies (ruc, razonSocial, usuario, contrasena, role, permissions)
    VALUES ('ADMIN', 'Administrador', ?, ?, 'admin', '{}')
    ON CONFLICT(ruc) DO UPDATE SET
      usuario    = excluded.usuario,
      contrasena = excluded.contrasena
  `).run(ADMIN_USUARIO, hash);
})();

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

app.post('/api/login', (req, res) => {
    const { usuario, contrasena } = req.body || {};
    if (!usuario || !contrasena) {
        return res.status(400).json({ error: 'Faltan credenciales' });
    }
    try {
        const user = db.prepare('SELECT * FROM companies WHERE usuario = ?').get(String(usuario));
        if (!user) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        if (!bcrypt.compareSync(contrasena, user.contrasena)) {
            // if stored password is plain text (migration from older version),
            // allow login and rehash automatically
            if (user.contrasena === contrasena) {
                const newHash = bcrypt.hashSync(contrasena, SALT_ROUNDS);
                db.prepare('UPDATE companies SET contrasena = ? WHERE ruc = ?').run(newHash, user.ruc);
            } else {
                return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            }
        }

        const safe = {
            ruc: user.ruc,
            razonSocial: user.razonSocial,
            usuario: user.usuario,
            role: user.role || 'client',
            permissions: JSON.parse(user.permissions || '{}'),
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
    safe.permissions = JSON.parse(safe.permissions || '{}');
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
app.get('/api/companies', (req, res) => {
    const ruc = req.query.ruc;
    try {
        if (ruc) {
            // clients may only look up their own RUC
            if (req.user.role === 'client' && req.user.ruc !== ruc) {
                return res.status(403).json({ error: 'No autorizado para ese RUC' });
            }
            const company = db.prepare('SELECT * FROM companies WHERE ruc = ?').get(ruc);
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
            const list = db.prepare('SELECT * FROM companies').all();
            res.json(list.map(safeCompany));
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
                const hashed = item.contrasena
                    ? bcrypt.hashSync(String(item.contrasena), SALT_ROUNDS)
                    : undefined;
                insert.run(
                    String(item.ruc), item.razonSocial, item.usuario,
                    hashed || item.contrasena || '',
                    item.role || 'client',
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
            const parts = key.split('_');
            const keyRuc = parts[0] === 'docs' ? parts[1] : parts[0];
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
            const vals = safe.map(([_, v]) => (typeof v === 'boolean' ? (v ? 1 : 0) : v));
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

app.listen(PORT, () => {
    console.log(`✅ Servidor listo en http://localhost:${PORT}  [modo: ${process.env.NODE_ENV || 'development'}]`);
    console.log(`   db path: ${DB_PATH}`);
});
