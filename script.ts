import "dotenv/config";
import { db } from "./lib/db.js";

async function run() {
  try {
    const [des] = await db.query('DESCRIBE desafios');
    console.log("Colunas desafios:", des);
    
    // tentar adicionar as colunas
    try {
      await db.query('ALTER TABLE desafios ADD COLUMN criterio_avaliacao TEXT NULL');
      await db.query('ALTER TABLE desafios ADD COLUMN aprovador_id VARCHAR(255) NULL');
      console.log('Colunas desafios adicionadas com sucesso.');
    } catch(e: any) {
      console.log('Colunas desafios já existem ou erro:', e.message);
    }

  } catch(e: any) {
    console.log(e);
  }
  process.exit(0);
}
run();
