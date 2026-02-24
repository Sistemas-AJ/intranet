import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import multiparty from 'multiparty';

const CLIENTES_DIR = path.resolve(process.cwd(), 'clientes');
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'database.sqlite');

// Asegurar que existan las carpetas
if (!fs.existsSync(CLIENTES_DIR)) fs.mkdirSync(CLIENTES_DIR, { recursive: true });
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// Inicializar SQLite
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Tablas
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

/** Helper: sanitizar nombre para carpeta */
function sanitize(name) {
    return (name || 'SIN_NOMBRE')
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+$/g, '')
        .trim() || 'SIN_NOMBRE';
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

/** Helper: leer body JSON */
function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch (e) { reject(e); }
        });
        req.on('error', reject);
    });
}

export default function clientesPlugin() {
    return {
        name: 'vite-plugin-clientes',
        configureServer(server) {
            // ── Servir archivos estáticos ──────────────────────────────────
            server.middlewares.use('/clientes', (req, res, next) => {
                const relativePath = req.url.split('?')[0];
                const fullPath = path.join(CLIENTES_DIR, decodeURIComponent(relativePath));
                if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
                    const ext = path.extname(fullPath).toLowerCase();
                    const mimeTypes = {
                        '.pdf': 'application/pdf',
                        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
                        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        '.xls': 'application/vnd.ms-excel',
                        '.doc': 'application/msword',
                        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    };
                    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
                    fs.createReadStream(fullPath).pipe(res);
                } else {
                    next();
                }
            });

            // ── API Companies (SQLite) ──────────────────────────────────────
            server.middlewares.use('/api/companies', async (req, res, next) => {
                const reqUrl = new URL(req.url, 'http://localhost');
                try {
                    if (req.method === 'GET') {
                        const ruc = reqUrl.searchParams.get('ruc');
                        if (ruc) {
                            const company = db.prepare('SELECT * FROM companies WHERE ruc = ?').get(ruc);
                            if (company) {
                                company.permissions = JSON.parse(company.permissions || '{}');
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify(company));
                            } else {
                                res.statusCode = 404; res.end(JSON.stringify({ error: 'No encontrado' }));
                            }
                        } else {
                            const list = db.prepare('SELECT * FROM companies').all();
                            list.forEach(c => { c.permissions = JSON.parse(c.permissions || '{}'); });
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(list));
                        }
                        return;
                    }
                    if (req.method === 'POST') {
                        const body = await readBody(req);
                        const list = Array.isArray(body) ? body : (body.companies ? body.companies : [body]);
                        const insert = db.prepare(`
                            INSERT INTO companies (ruc, razonSocial, usuario, contrasena, role, permissions)
                            VALUES (?, ?, ?, ?, ?, ?)
                            ON CONFLICT(ruc) DO UPDATE SET
                            razonSocial = excluded.razonSocial,
                            usuario = excluded.usuario,
                            contrasena = excluded.contrasena,
                            role = excluded.role,
                            permissions = excluded.permissions
                        `);
                        const tx = db.transaction((items) => {
                            for (const item of items) {
                                if (!item.ruc) continue;
                                insert.run(String(item.ruc), item.razonSocial, item.usuario, item.contrasena, item.role || 'client', JSON.stringify(item.permissions || {}));
                            }
                        });
                        tx(list);
                        res.end(JSON.stringify({ ok: true }));
                        return;
                    }
                    if (req.method === 'DELETE') {
                        const ruc = reqUrl.pathname.split('/').pop();
                        if (ruc && ruc !== 'companies') {
                            db.prepare('DELETE FROM companies WHERE ruc = ?').run(ruc);
                            res.end(JSON.stringify({ ok: true }));
                        } else {
                            res.statusCode = 400; res.end(JSON.stringify({ error: 'Falta RUC' }));
                        }
                        return;
                    }
                } catch (e) {
                    res.statusCode = 500; res.end(JSON.stringify({ error: e.message }));
                    return;
                }
                next();
            });

            // ── API Legacy (Para compatibilidad temporal) ──────────────────
            server.middlewares.use('/api/clientes', async (req, res, next) => {
                if (req.method === 'GET') {
                    const list = db.prepare('SELECT * FROM companies').all();
                    list.forEach(c => { c.permissions = JSON.parse(c.permissions || '{}'); });
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(list));
                    return;
                }
                next();
            });

            // ── API History ──────────────────────────────────────────────────
            server.middlewares.use('/api/history', async (req, res, next) => {
                try {
                    if (req.method === 'GET') {
                        const logs = db.prepare('SELECT * FROM history_logs ORDER BY id DESC LIMIT 100').all();
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(logs));
                        return;
                    }
                    if (req.method === 'POST') {
                        const { action, details } = await readBody(req);
                        db.prepare('INSERT INTO history_logs (action, details, timestamp) VALUES (?, ?, ?)').run(action, details, new Date().toISOString());
                        res.end(JSON.stringify({ ok: true }));
                        return;
                    }
                } catch (e) {
                    res.statusCode = 500; res.end(JSON.stringify({ error: e.message }));
                    return;
                }
                next();
            });

            // ── API Upload (Multipart) ──────────────────────────────────────
            server.middlewares.use('/api/upload', (req, res, next) => {
                if (req.method !== 'POST') return next();
                const form = new multiparty.Form();
                form.parse(req, async (err, fields, files) => {
                    if (err) { res.statusCode = 500; return res.end(JSON.stringify({ error: err.message })); }
                    try {
                        const ruc = fields.ruc[0];
                        const section = fields.section[0];
                        const year = fields.year[0];
                        const month = fields.month[0];
                        const storageKey = fields.storageKey[0];
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
                                storageKey, ruc, section, year, month,
                                name: file.originalFilename, url: publicUrl,
                                type: extraData.type || 'Documento',
                                description: extraData.description || '',
                                isNonDeducible: extraData.isNonDeducible ? 1 : 0,
                                uploadedBy: extraData.uploadedBy || 'admin',
                                seenByAdmin: extraData.uploadedBy === 'client' ? 0 : 1,
                                seenByClient: extraData.uploadedBy === 'client' ? 1 : 0,
                                timestamp: new Date().toISOString()
                            };

                            db.prepare(`INSERT INTO documents (id, storageKey, ruc, section, year, month, name, url, type, description, isNonDeducible, uploadedBy, seenByAdmin, seenByClient, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(doc.id, doc.storageKey, doc.ruc, doc.section, doc.year, doc.month, doc.name, doc.url, doc.type, doc.description, doc.isNonDeducible, doc.uploadedBy, doc.seenByAdmin, doc.seenByClient, doc.timestamp);

                            if (doc.uploadedBy === 'client') {
                                const meta = db.prepare('SELECT * FROM metadata WHERE storageKey = ?').get(storageKey);
                                const events = meta ? JSON.parse(meta.events || '[]') : [];
                                events.push({ id: Date.now(), message: `${extraData.companyName || ruc} subió: ${file.originalFilename}`, timestamp: doc.timestamp });
                                db.prepare(`INSERT INTO metadata (storageKey, unreadForAdmin, unreadForClient, events) VALUES (?, 1, 0, ?) ON CONFLICT(storageKey) DO UPDATE SET unreadForAdmin = 1, events = ?`).run(storageKey, JSON.stringify(events), JSON.stringify(events));
                            }
                            results.push(doc);
                        }
                        res.end(JSON.stringify({ ok: true, documents: results }));
                    } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
                });
            });

            // ── API Docs (Reader & Delete) ──────────────────────────────────
            server.middlewares.use('/api/docs', async (req, res, next) => {
                const reqUrl = new URL(req.url, 'http://localhost');
                const key = reqUrl.searchParams.get('key');
                try {
                    if (req.method === 'GET' && key) {
                        const docs = db.prepare('SELECT * FROM documents WHERE storageKey = ?').all(key);
                        const meta = db.prepare('SELECT * FROM metadata WHERE storageKey = ?').get(key);
                        res.end(JSON.stringify({
                            list: docs.map(d => ({ ...d, isNonDeducible: d.isNonDeducible === 1, seenByAdmin: d.seenByAdmin === 1, seenByClient: d.seenByClient === 1 })),
                            metadata: meta ? { unreadForAdmin: meta.unreadForAdmin === 1, unreadForClient: meta.unreadForClient === 1, events: JSON.parse(meta.events || '[]') } : { unreadForAdmin: false, unreadForClient: false, events: [] }
                        }));
                        return;
                    }
                    if (req.method === 'DELETE') {
                        const id = reqUrl.searchParams.get('id');
                        if (id) {
                            const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
                            if (doc) {
                                const p = path.join(process.cwd(), doc.url.startsWith('/') ? doc.url.substring(1) : doc.url);
                                if (fs.existsSync(p)) {
                                    fs.unlinkSync(p);
                                    removeEmptyParents(p, CLIENTES_DIR);
                                }
                                db.prepare('DELETE FROM documents WHERE id = ?').run(id);
                            }
                        } else if (key) {
                            const docs = db.prepare('SELECT * FROM documents WHERE storageKey = ?').all(key);
                            for (const doc of docs) {
                                const p = path.join(process.cwd(), doc.url.startsWith('/') ? doc.url.substring(1) : doc.url);
                                if (fs.existsSync(p)) {
                                    fs.unlinkSync(p);
                                    removeEmptyParents(p, CLIENTES_DIR);
                                }
                            }
                            db.prepare('DELETE FROM documents WHERE storageKey = ?').run(key);
                        }
                        res.end(JSON.stringify({ ok: true }));
                        return;
                    }
                } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); return; }
                next();
            });

            // ── API Update (Docs & Metadata) ────────────────────────────────
            server.middlewares.use('/api/docs/update', async (req, res, next) => {
                if (req.method !== 'POST') return next();
                const id = new URL(req.url, 'http://localhost').searchParams.get('id');
                try {
                    const body = await readBody(req);
                    const entries = Object.entries(body);
                    if (id && entries.length > 0) {
                        const set = entries.map(([k]) => `${k} = ?`).join(', ');
                        const vals = entries.map(([_, v]) => typeof v === 'boolean' ? (v ? 1 : 0) : v);
                        db.prepare(`UPDATE documents SET ${set} WHERE id = ?`).run(...vals, id);
                    }
                    res.end(JSON.stringify({ ok: true }));
                } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
            });

            server.middlewares.use('/api/docs-metadata', async (req, res, next) => {
                if (req.method !== 'POST') return next();
                try {
                    const { key, unreadForAdmin, unreadForClient, clearEvents } = await readBody(req);
                    db.prepare(`UPDATE metadata SET unreadForAdmin = COALESCE(?, unreadForAdmin), unreadForClient = COALESCE(?, unreadForClient), events = CASE WHEN ? = 1 THEN '[]' ELSE events END WHERE storageKey = ?`)
                        .run(unreadForAdmin === undefined ? null : (unreadForAdmin ? 1 : 0), unreadForClient === undefined ? null : (unreadForClient ? 1 : 0), clearEvents ? 1 : 0, key);
                    res.end(JSON.stringify({ ok: true }));
                } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
            });
        }
    };
}
