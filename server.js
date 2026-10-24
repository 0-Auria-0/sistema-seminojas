require('dotenv').config();
const express = require('express');
const { neon } = require('@neondatabase/serverless');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Conexão segura com o banco de dados Neon Serverless
const sql = neon(process.env.DATABASE_URL);

// Testar conexão ao iniciar
async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('Conectado com sucesso ao Neon Database!');
  } catch (err) {
    console.error('Erro ao conectar ao Neon Database:', err);
  }
}
testConnection();

// Rota de Autenticação com o Google
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // Verificar se o usuário já existe no Neon
    const existingUsers = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (existingUsers.length > 0) {
      return res.json({ success: true, user: existingUsers[0] });
    } else {
      const newUser = await sql`
        INSERT INTO users (name, email, google_id) 
        VALUES (${name}, ${email}, ${googleId}) 
        RETURNING id, name, email
      `;
      return res.json({ success: true, user: newUser[0] });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Token inválido ou erro no servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Este e-mail já está cadastrado.' });
    }
    const newUser = await sql`
      INSERT INTO users (name, email, password) 
      VALUES (${name}, ${email}, ${password}) 
      RETURNING id, name, email
    `;
    return res.json({ success: true, user: newUser[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Erro no servidor ao criar conta.' });
  }
});