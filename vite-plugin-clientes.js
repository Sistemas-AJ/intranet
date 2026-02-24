import fs from 'fs';
import path from 'path';

const CLIENTES_DIR = path.resolve(process.cwd(), 'clientes');

/**
 * Vite plugin que agrega endpoints API para crear/eliminar carpetas de clientes
 * en el sistema de archivos local.
 */
export default function clientesPlugin() {
    // Asegurar que exista la carpeta raíz
    if (!fs.existsSync(CLIENTES_DIR)) {
        fs.mkdirSync(CLIENTES_DIR, { recursive: true });
    }

    return {
        name: 'vite-plugin-clientes',
        configureServer(server) {
            // ── POST /api/clientes → Crear carpeta + info.json ───────────────
            server.middlewares.use('/api/clientes/sync', (req, res, next) => {
                if (req.method !== 'POST') return next();

                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                    try {
                        const { companies } = JSON.parse(body);
                        if (!Array.isArray(companies)) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({ error: 'Se esperaba un array de companies' }));
                            return;
                        }

                        let created = 0;
                        for (const company of companies) {
                            const folderName = `${company.ruc} - ${sanitize(company.razonSocial)}`;
                            const folderPath = path.join(CLIENTES_DIR, folderName);

                            if (!fs.existsSync(folderPath)) {
                                fs.mkdirSync(folderPath, { recursive: true });
                                created++;
                            }

                            // Siempre actualizar info.json
                            const info = {
                                ruc: company.ruc,
                                razonSocial: company.razonSocial,
                                direccion: company.direccion || '',
                                usuario: company.usuario,
                                contrasena: company.contrasena,
                                permisos: company.permissions || {},
                                ultimaActualizacion: new Date().toISOString(),
                            };
                            fs.writeFileSync(
                                path.join(folderPath, 'info.json'),
                                JSON.stringify(info, null, 4),
                                'utf-8'
                            );
                        }

                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: true, total: companies.length, created }));
                    } catch (e) {
                        console.error('[clientes-plugin] Error en sync:', e);
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: e.message }));
                    }
                });
            });

            // ── POST /api/clientes → Crear una sola carpeta ──────────────────
            server.middlewares.use('/api/clientes', (req, res, next) => {
                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const company = JSON.parse(body);
                            const folderName = `${company.ruc} - ${sanitize(company.razonSocial)}`;
                            const folderPath = path.join(CLIENTES_DIR, folderName);

                            if (!fs.existsSync(folderPath)) {
                                fs.mkdirSync(folderPath, { recursive: true });
                            }

                            const info = {
                                ruc: company.ruc,
                                razonSocial: company.razonSocial,
                                direccion: company.direccion || '',
                                usuario: company.usuario,
                                contrasena: company.contrasena,
                                permisos: company.permissions || {},
                                creadoEl: new Date().toISOString(),
                            };
                            fs.writeFileSync(
                                path.join(folderPath, 'info.json'),
                                JSON.stringify(info, null, 4),
                                'utf-8'
                            );

                            console.log(`[clientes] ✅ Carpeta creada: ${folderName}`);
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, folder: folderName }));
                        } catch (e) {
                            console.error('[clientes-plugin] Error creando carpeta:', e);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: e.message }));
                        }
                    });
                    return;
                }

                if (req.method === 'DELETE') {
                    // DELETE /api/clientes?ruc=XXXX
                    const url = new URL(req.url, 'http://localhost');
                    const ruc = url.searchParams.get('ruc');
                    if (!ruc) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Falta parámetro ruc' }));
                        return;
                    }

                    try {
                        // Buscar carpeta que empiece con el RUC
                        const folders = fs.readdirSync(CLIENTES_DIR);
                        const target = folders.find(f => f.startsWith(ruc));

                        if (target) {
                            fs.rmSync(path.join(CLIENTES_DIR, target), { recursive: true, force: true });
                            console.log(`[clientes] 🗑️ Carpeta eliminada: ${target}`);
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, deleted: target }));
                        } else {
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, deleted: null, message: 'No se encontró carpeta' }));
                        }
                    } catch (e) {
                        console.error('[clientes-plugin] Error eliminando:', e);
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: e.message }));
                    }
                    return;
                }

                next();
            });
        }
    };
}

/** Sanitizar nombre para carpeta (eliminar caracteres inválidos en Windows) */
function sanitize(name) {
    return (name || 'SIN_NOMBRE')
        .replace(/[<>:"/\\|?*]/g, '_')  // Caracteres inválidos en Windows
        .replace(/\.+$/g, '')            // Windows no permite puntos al final
        .replace(/\s+$/g, '')            // Ni espacios al final
        .trim() || 'SIN_NOMBRE';
}
