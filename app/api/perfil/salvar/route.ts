import { NextResponse } from 'next/server';
// Caminho curto, direto e dentro da pasta app:
import db from "../../../lib/db"; 
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, bio, description, avatar } = body;

        if (!username) {
            return NextResponse.json({ error: "Nickname é obrigatório." }, { status: 400 });
        }

        let fotoUrl = '/images/default-avatar.png';

        if (avatar && typeof avatar === 'string' && avatar.includes('base64')) {
            const base64Data = avatar.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            
            const fileName = `profile-${Date.now()}-${username.replace(/\s+/g, '_')}.jpg`;
            const uploadDir = path.join(process.cwd(), 'public/uploads');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            
            fotoUrl = `/uploads/${fileName}`;
        }

        const query = `
            INSERT INTO usuarios (nickname, bio, descricao, foto_url) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            bio = VALUES(bio), 
            descricao = VALUES(descricao), 
            foto_url = VALUES(foto_url)
        `;

        await db.execute(query, [username, bio, description, fotoUrl]);

        return NextResponse.json({ 
            success: true,
            message: "Perfil processado com sucesso!", 
            url: fotoUrl 
        }, { status: 201 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("ERRO NA API ATIVORA:", errorMessage);
        
        return NextResponse.json({ 
            error: "Falha na comunicação com o banco de dados.",
            details: errorMessage 
        }, { status: 500 });
    }
}