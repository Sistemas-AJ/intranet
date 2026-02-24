import express from 'express';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import multiparty from 'multiparty';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const CLIENTES_DIR = path.resolve(__dirname, 'clientes');
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'database.sqlite');
const DIST_DIR = path.join(__dirname, 'dist');

// Asegurar carpetas
if (!fs.existsSync(CLIENTES_DIR)) fs.mkdirSync(CLIENTES_DIR, { recursive: true });
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Inicialización de tablas (Idéntico al plugin)
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

// ── API ROUTES ──────────────────────────────────────────────────────────────

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
            list.forEach(c => { c.permissions = JSON.parse(c.permissions || '{}'); });
            res.json(list);
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/companies', (req, res) => {
    const list = Array.isArray(req.body) ? req.body : (req.body.companies ? req.body.companies : [req.body]);
    try {
        const insert = db.prepare(`
            INSERT INTO companies (ruc, razonSocial, usuario, contrasena, role, permissions)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(ruc) DO UPDATE SET
            razonSocial = excluded.razonSocial, usuario = excluded.usuario,
            contrasena = excluded.contrasena, role = excluded.role, permissions = excluded.permissions
        `);
        const tx = db.transaction((items) => {
            for (const item of items) {
                if (!item.ruc) continue;
                insert.run(String(item.ruc), item.razonSocial, item.usuario, item.contrasena, item.role || 'client', JSON.stringify(item.permissions || {}));
            }
        });
        tx(list);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/companies/:ruc', (req, res) => {
    try {
        db.prepare('DELETE FROM companies WHERE ruc = ?').run(req.params.ruc);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/history', (req, res) => {
    try {
        const logs = db.prepare('SELECT * FROM history_logs ORDER BY id DESC LIMIT 100').all();
        res.json(logs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/upload', (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        if (err) return res.status(500).json({ error: err.message });
        try {
            const ruc = fields.ruc[0], section = fields.section[0], year = fields.year[0], month = fields.month[0], storageKey = fields.storageKey[0];
            const extraData = JSON.parse(fields.extraData[0]);
            const uploadedFiles = files.file || [];
            const results = [];

            for (const file of uploadedFiles) {
                const relativeDir = path.join(ruc, section, year, month);
                const targetDir = path.join(CLIENTES_DIR, relativeDir);
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

                const timestamp = Date.now();
                const fileName = `${ruc}_${section}_${timestamp}_${sanitize(file.originalFilename)}`;
                const targetPath = path.join(targetDir, fileName);
                const publicUrl = `/clientes/${ruc}/${section}/${year}/${month}/${fileName}`.replace(/\\/g, '/');

                fs.copyFileSync(file.path, targetPath);
                fs.unlinkSync(file.path);

                const doc = {
                    id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                    storageKey, ruc, section, year, month, name: file.originalFilename, url: publicUrl,
                    type: extraData.type || 'Documento', description: extraData.description || '',
                    isNonDeducible: extraData.isNonDeducible ? 1 : 0, uploadedBy: extraData.uploadedBy || 'admin',
                    seenByAdmin: extraData.uploadedBy === 'client' ? 0 : 1, seenByClient: extraData.uploadedBy === 'client' ? 1 : 0,
                    timestamp: new Date().toISOString()
                };
                db.prepare(`INSERT INTO documents (id, storageKey, ruc, section, year, month, name, url, type, description, isNonDeducible, uploadedBy, seenByAdmin, seenByClient, timestamp) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(doc.id, doc.storageKey, doc.ruc, doc.section, doc.year, doc.month, doc.name, doc.url, doc.type, doc.description, doc.isNonDeducible, doc.uploadedBy, doc.seenByAdmin, doc.seenByClient, doc.timestamp);

                if (doc.uploadedBy === 'client') {
                    const meta = db.prepare('SELECT * FROM metadata WHERE storageKey = ?').get(storageKey);
                    const events = meta ? JSON.parse(meta.events || '[]') : [];
                    events.push({ id: Date.now(), message: `${extraData.companyName || ruc} subió: ${file.originalFilename}`, timestamp: doc.timestamp });
                    db.prepare(`INSERT INTO metadata (storageKey, unreadForAdmin, unreadForClient, events) VALUES (?, 1, 0, ?) ON CONFLICT(storageKey) DO UPDATE SET unreadForAdmin = 1, events = ?`).run(storageKey, JSON.stringify(events), JSON.stringify(events));
                }
                results.push(doc);
            }
            res.json({ ok: true, documents: results });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
});

app.get('/api/docs', (req, res) => {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'Falta key' });
    try {
        const docs = db.prepare('SELECT * FROM documents WHERE storageKey = ?').all(key);
        const meta = db.prepare('SELECT * FROM metadata WHERE storageKey = ?').get(key);
        res.json({
            list: docs.map(d => ({ ...d, isNonDeducible: d.isNonDeducible === 1, seenByAdmin: d.seenByAdmin === 1, seenByClient: d.seenByClient === 1 })),
            metadata: meta ? { unreadForAdmin: meta.unreadForAdmin === 1, unreadForClient: meta.unreadForClient === 1, events: JSON.parse(meta.events || '[]') } : { unreadForAdmin: false, unreadForClient: false, events: [] }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/docs', (req, res) => {
    const id = req.query.id, key = req.query.key;
    try {
        if (id) {
            const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
            if (doc) {
                const p = path.join(__dirname, doc.url.startsWith('/') ? doc.url.substring(1) : doc.url);
                if (fs.existsSync(p)) {
                    fs.unlinkSync(p);
                    removeEmptyParents(p, CLIENTES_DIR);
                }
                db.prepare('DELETE FROM documents WHERE id = ?').run(id);
            }
        } else if (key) {
            const docs = db.prepare('SELECT * FROM documents WHERE storageKey = ?').all(key);
            for (const doc of docs) {
                const p = path.join(__dirname, doc.url.startsWith('/') ? doc.url.substring(1) : doc.url);
                if (fs.existsSync(p)) {
                    fs.unlinkSync(p);
                    removeEmptyParents(p, CLIENTES_DIR);
                }
            }
            db.prepare('DELETE FROM documents WHERE storageKey = ?').run(key);
        }
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/docs/update', (req, res) => {
    const id = req.query.id;
    try {
        const entries = Object.entries(req.body);
        if (id && entries.length > 0) {
            const set = entries.map(([k]) => `${k} = ?`).join(', ');
            const vals = entries.map(([_, v]) => typeof v === 'boolean' ? (v ? 1 : 0) : v);
            db.prepare(`UPDATE documents SET ${set} WHERE id = ?`).run(...vals, id);
        }
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/docs-metadata', (req, res) => {
    try {
        const { key, unreadForAdmin, unreadForClient, clearEvents } = req.body;
        db.prepare(`UPDATE metadata SET unreadForAdmin = COALESCE(?, unreadForAdmin), unreadForClient = COALESCE(?, unreadForClient), events = CASE WHEN ? = 1 THEN '[]' ELSE events END WHERE storageKey = ?`)
            .run(unreadForAdmin === undefined ? null : (unreadForAdmin ? 1 : 0), unreadForClient === undefined ? null : (unreadForClient ? 1 : 0), clearEvents ? 1 : 0, key);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SERVE STATIC FILES ──────────────────────────────────────────────────────

app.use('/clientes', express.static(CLIENTES_DIR));
app.use(express.static(DIST_DIR));

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor de producción listo en http://localhost:${PORT}`);
});
