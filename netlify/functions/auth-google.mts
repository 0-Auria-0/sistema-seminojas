import { neon } from '@neondatabase/serverless';
import { OAuth2Client } from 'google-auth-library';

// Rota de Autenticação com o Google
export default async (req: Request) => {
  const sql = neon(process.env.DATABASE_URL!);
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

  try {
    const { credential } = await req.json();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name } = ticket.getPayload()!;

    // Verificar se o usuário já existe no Neon
    const existingUsers = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (existingUsers.length > 0) {
      return Response.json({ success: true, user: existingUsers[0] });
    }

    const newUser = await sql`
      INSERT INTO users (name, email, google_id)
      VALUES (${name}, ${email}, ${googleId})
      RETURNING id, name, email
    `;
    return Response.json({ success: true, user: newUser[0] });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: 'Token inválido ou erro no servidor.' }, { status: 400 });
  }
};

export const config = { path: '/api/auth/google', method: 'POST' };
