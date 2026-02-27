import Database from 'better-sqlite3';
import { Pool } from 'pg';
import { DATABASE_URL, DB_PATH, USE_POSTGRES } from './config.js';

let sqliteDB;
let pgPool;

if (USE_POSTGRES) {
  // create a connection pool to Postgres
  pgPool = new Pool({ connectionString: DATABASE_URL });
} else {
  sqliteDB = new Database(DB_PATH);
  sqliteDB.pragma('journal_mode = WAL');
}

// helpers that mirror some of the better-sqlite3 API but using pg when
// requested.  Right now this is very minimal; once the migration is
// complete we can delete the sqlite branch entirely.

export function prepare(sql) {
  if (USE_POSTGRES) {
    // return an object with run/get/all wrappers that call pool.query
    return {
      run: (params = []) => pgPool.query(sql, params),
      get: (params = []) => pgPool.query(sql + ' LIMIT 1', params).then(r => r.rows[0]),
      all: (params = []) => pgPool.query(sql, params).then(r => r.rows),
    };
  }
  return sqliteDB.prepare(sql);
}

export function exec(sql) {
  if (USE_POSTGRES) {
    return pgPool.query(sql);
  }
  return sqliteDB.exec(sql);
}

export function query(text, params) {
  if (USE_POSTGRES) {
    return pgPool.query(text, params);
  }
  // sqlite doesn't have a plain `query`, so we forward to all()
  return sqliteDB.prepare(text).all(params);
}

export default {
  prepare,
  exec,
  query,
};
