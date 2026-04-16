import mysql from "mysql2/promise";

// Dizemos ao TypeScript que essa variável global existe
declare global {
  var mysqlPool: mysql.Pool | undefined;
}

// Configurações de Elite para Alta Performance e Estabilidade
const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  waitForConnections: true,
  connectionLimit: 20, 
  queueLimit: 0,       
  
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

// Padrão Singleton: Usa o Pool existente ou cria um novo
const pool = globalThis.mysqlPool || mysql.createPool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalThis.mysqlPool = pool;
}

// ✅ EXPORTAÇÃO NOMEADA (Resolve o erro 1192)
export const db = pool;
export default db;
