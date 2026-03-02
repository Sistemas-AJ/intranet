import Database from 'better-sqlite3';
import { Pool } from 'pg';
import { DATABASE_URL, DB_PATH, USE_POSTGRES } from './config.js';

let sqliteDB;
let pgPool;

if (USE_POSTGRES) {
  pgPool = new Pool({ connectionString: DATABASE_URL });
} else {
  sqliteDB = new Database(DB_PATH);
  sqliteDB.pragma('journal_mode = WAL');
}

function normalizeParams(params = []) {
  if (Array.isArray(params)) return params;
  if (params === undefined) return [];
  return [params];
}

function toPgSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function pgQuery(sql, params = [], client = pgPool) {
  return client.query(toPgSql(sql), normalizeParams(params));
}

function sqliteStatement(sql) {
  return sqliteDB.prepare(sql);
}

async function get(sql, params = [], client) {
  const values = normalizeParams(params);
  if (USE_POSTGRES) {
    const result = await pgQuery(`${sql} LIMIT 1`, values, client);
    return result.rows[0];
  }
  return sqliteStatement(sql).get(...values);
}

async function all(sql, params = [], client) {
  const values = normalizeParams(params);
  if (USE_POSTGRES) {
    const result = await pgQuery(sql, values, client);
    return result.rows;
  }
  return sqliteStatement(sql).all(...values);
}

async function run(sql, params = [], client) {
  const values = normalizeParams(params);
  if (USE_POSTGRES) {
    return pgQuery(sql, values, client);
  }
  return sqliteStatement(sql).run(...values);
}

export async function exec(sql, client) {
  if (USE_POSTGRES) {
    return pgQuery(sql, [], client);
  }
  return sqliteDB.exec(sql);
}

export async function query(sql, params = [], client) {
  return all(sql, params, client);
}

export function transaction(fn) {
  return async (...args) => {
    if (USE_POSTGRES) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        const txDb = {
          get: (sql, params = []) => get(sql, params, client),
          all: (sql, params = []) => all(sql, params, client),
          run: (sql, params = []) => run(sql, params, client),
          exec: (sql) => exec(sql, client),
        };
        const result = await fn(txDb, ...args);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    sqliteDB.exec('BEGIN');
    try {
      const txDb = {
        get: (sql, params = []) => get(sql, params),
        all: (sql, params = []) => all(sql, params),
        run: (sql, params = []) => run(sql, params),
        exec,
      };
      const result = await fn(txDb, ...args);
      sqliteDB.exec('COMMIT');
      return result;
    } catch (error) {
      sqliteDB.exec('ROLLBACK');
      throw error;
    }
  };
}

export default {
  get,
  all,
  run,
  exec,
  query,
  transaction,
};
