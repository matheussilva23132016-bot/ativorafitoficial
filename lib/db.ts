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
  
  // Controle de Tráfego (Evita que o banco caia em picos de acesso)
  waitForConnections: true,
  connectionLimit: 20, // Quantidade de conexões simultâneas permitidas
  queueLimit: 0,       // Sem limite de fila de espera
  
  // Resiliência de Conexão (Essencial para Hostinger)
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

// Padrão Singleton: Usa o Pool existente ou cria um novo se não existir
const pool = globalThis.mysqlPool || mysql.createPool(poolConfig);

// No modo de desenvolvimento, salvamos o Pool na variável global
// para que o Next.js não crie centenas de conexões ao salvar arquivos.
if (process.env.NODE_ENV !== "production") {
  globalThis.mysqlPool = pool;
}

export default pool;