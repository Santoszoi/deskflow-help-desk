import Sqlite from 'better-sqlite3';
import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sqliteSchema } from './schema.js';
import { mysqlTlsOptions } from './mysql-tls.js';

export const mysqlSchema = [
`CREATE TABLE IF NOT EXISTS users (
 id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL,
 email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL,
 role ENUM('ADMIN','AGENT','USER') NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS tickets (
 id INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(255) NOT NULL, description TEXT NOT NULL,
 asset TEXT, category VARCHAR(255) NOT NULL, priority ENUM('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL,
 status ENUM('ABERTO','EM_ATENDIMENTO','AGUARDANDO_USUARIO','RESOLVIDO','FECHADO') NOT NULL DEFAULT 'ABERTO',
 requester_id INT NOT NULL, assignee_id INT,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(requester_id) REFERENCES users(id), FOREIGN KEY(assignee_id) REFERENCES users(id)
) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS ticket_history (
 id INT PRIMARY KEY AUTO_INCREMENT, ticket_id INT NOT NULL, user_id INT NOT NULL,
 action VARCHAR(100) NOT NULL, details TEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS ticket_comments (
 id INT PRIMARY KEY AUTO_INCREMENT, ticket_id INT NOT NULL, user_id INT NOT NULL,
 message TEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB`
];

// Both adapters execute real parameterized queries. No mock success response.
export async function connectDatabase() {
 const engine = process.env.DB_CLIENT || 'sqlite';
 if (!['sqlite','mysql'].includes(engine)) throw new Error('DB_CLIENT must be sqlite or mysql');
 let pool: Pool | undefined;
 let sqlite: Sqlite.Database | undefined;
 if (engine === 'mysql') {
  if (!process.env.DB_PASSWORD) throw new Error('DB_PASSWORD is required for MySQL');
  pool = mysql.createPool({host:process.env.DB_HOST || '127.0.0.1', port:Number(process.env.DB_PORT || 3306),
   user:process.env.DB_USER || 'deskflow', password:process.env.DB_PASSWORD,
   database:process.env.DB_NAME || 'deskflow', connectionLimit:10, timezone:'Z',dateStrings:true,
   charset:'utf8mb4', ssl:mysqlTlsOptions()});
  try {for(const sql of mysqlSchema) await pool.execute(sql)} catch(error){await pool.end();throw error}
 } else {
  const file = process.env.SQLITE_PATH || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/helpdesk.db');
  fs.mkdirSync(path.dirname(file), {recursive:true});
  sqlite = new Sqlite(file);sqlite.pragma('journal_mode = WAL');sqlite.pragma('foreign_keys = ON');sqlite.exec(sqliteSchema);
  const columns = sqlite.prepare('PRAGMA table_info(tickets)').all() as {name:string}[];
  if(!columns.some(c=>c.name==='asset'))sqlite.exec('ALTER TABLE tickets ADD COLUMN asset TEXT');
 }
 async function executeQuery(sql:string, values:Array<string | number | boolean | null | Buffer>=[]){
  if(pool){const [rows]=await pool.execute(sql,values);return rows}
  return sqlite!.prepare(sql).all(...values);
 }
 return {engine, executeQuery,
  prepare(sql:string){return {
   async all(...values:Array<string | number | boolean | null | Buffer>){return executeQuery(sql,values)},
   async get(...values:Array<string | number | boolean | null | Buffer>){return (await executeQuery(sql,values) as RowDataPacket[])[0]},
   async run(...values:Array<string | number | boolean | null | Buffer>){
    if(pool){const [r]=await pool.execute<ResultSetHeader>(sql,values);return {lastInsertRowid:r.insertId,changes:r.affectedRows}}
    const r=sqlite!.prepare(sql).run(...values);return {lastInsertRowid:Number(r.lastInsertRowid),changes:r.changes};
   }
  }},
  async close(){if(pool)await pool.end();sqlite?.close()}
 };
}
