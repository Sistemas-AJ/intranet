import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

try {
    const dbPath = path.resolve('data/database.sqlite');
    console.log('DB Path:', dbPath);
    const db = new Database(dbPath);
    let output = '';

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    output += '--- TABLES ---\n';
    output += JSON.stringify(tables, null, 2) + '\n\n';

    for (const table of tables) {
        const name = table.name;
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get().count;
        output += `--- TABLE: ${name} (${count} rows) ---\n`;
        const rows = db.prepare(`SELECT * FROM ${name}`).all();
        output += JSON.stringify(rows, null, 2) + '\n\n';
    }

    const outputPath = path.resolve('db_inspect_output.txt');
    fs.writeFileSync(outputPath, output);
    console.log('Output successfully written to:', outputPath);
} catch (err) {
    console.error('ERROR in script:', err);
    process.exit(1);
}
