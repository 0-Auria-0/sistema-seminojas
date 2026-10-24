const mysql = require('mysql2');

// Cria a ligação usando a URL do MySQL da Railway
const connection = mysql.createConnection(process.env.DATABASE_URL || {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sistema_seminojas'
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    return;
  }
  console.log('Ligado com sucesso à base de dados MySQL!');
});

module.exports = connection;