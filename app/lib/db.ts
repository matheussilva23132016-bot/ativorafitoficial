import mysql from "mysql2/promise";

declare global {
  var _mysqlPool: mysql.Pool | undefined;
}

const pool =
  global._mysqlPool ??
  mysql.createPool({
    host:               process.env.DB_HOST     ?? "srv2038.hstgr.io",
    port:               Number(process.env.DB_PORT ?? 3306),
    user:               process.env.DB_USER     ?? "u209256281_ativoraadm",
    password:           process.env.DB_PASSWORD ?? "909053Ms@",
    database:           process.env.DB_NAME     ?? "u209256281_ativoradadosfi",
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone:           "Z",
    charset:            "utf8mb4",
    ssl:                { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  global._mysqlPool = pool;
}

export const db = pool;
export default pool;
