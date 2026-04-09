import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // --- PROTOCOLO NATIVO DE IDENTIDADE ---
    // Usamos o crypto nativo do ambiente para gerar o ID único
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    // Caminho da pasta de uploads (dentro de public para ser acessível via URL)
    const uploadDir = join(process.cwd(), "public", "uploads");
    
    // Garante que a pasta existe no servidor da Hostinger
    try { 
      await mkdir(uploadDir, { recursive: true }); 
    } catch (e) {
      // Pasta já existe ou permissão concedida
    }

    const path = join(uploadDir, fileName);
    await writeFile(path, buffer);

    // Retorna a URL pública para ser salva no MySQL
    const publicUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("ERRO NO UPLOAD DA MATRIZ:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}