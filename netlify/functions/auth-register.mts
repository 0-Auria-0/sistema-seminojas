import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// Rota de cadastro com e-mail e senha
export default async (req: Request) => {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const { name, email, password } = await req.json();
    const existing = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return Response.json({ success: false, error: 'Este e-mail já está cadastrado.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await sql`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, name, email
    `;
    return Response.json({ success: true, user: newUser[0] });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: 'Erro no servidor ao criar conta.' }, { status: 500 });
  }
};

export const config = { path: '/api/auth/register', method: 'POST' };
