import { Pool } from 'pg';
import { DATABASE_URL } from './config.js';

const pgPool = new Pool({ connectionString: DATABASE_URL });

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

async function get(sql, params = [], client) {
  const values = normalizeParams(params);
  const result = await pgQuery(`${sql} LIMIT 1`, values, client);
  return result.rows[0];
}

async function all(sql, params = [], client) {
  const values = normalizeParams(params);
  const result = await pgQuery(sql, values, client);
  return result.rows;
}

async function run(sql, params = [], client) {
  const values = normalizeParams(params);
  return pgQuery(sql, values, client);
}

export async function exec(sql, client) {
  return pgQuery(sql, [], client);
}

export async function query(sql, params = [], client) {
  return all(sql, params, client);
}

export function transaction(fn) {
  return async (...args) => {
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
