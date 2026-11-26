const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Importa a função de consulta do banco
const { query } = require('./database');

// Importa as rotas
const produtoRoutes = require('./routes/produtoRoute');
const clienteRoutes = require('./routes/clienteRoute');
const categoriaRoutes = require('./routes/categoriaRoute');
const loginRoutes = require('./routes/loginRoute');
const funcionarioRoutes = require('./routes/funcionarioRoute');
const enderecoRoutes = require('./routes/enderecoRoute');
const pedidoRoutes = require('./routes/pedidoRoute');

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

app.use(cookieParser(process.env.COOKIE_SECRET));

// Servir imagens estáticas
app.use('/imagens', express.static(path.join(__dirname, '../front/Visão ADM/imagens')));
// Definir Rotas
app.use('/produto', produtoRoutes);
app.use('/cliente', clienteRoutes);
app.use('/categoria', categoriaRoutes);
app.use('/login', loginRoutes);
app.use('/funcionario', funcionarioRoutes);
app.use('/endereco', enderecoRoutes);
app.use('/pedido', pedidoRoutes);

console.log('ROTA DE FUNCIONÁRIOS MONTADA!');


const PORT = process.env.PORT || 3001;


// Inicializa o servidor e testa o PostgreSQL
app.listen(PORT, async () => {
    console.log(`\n=================================`);
    console.log(`🚀 Servidor executando na porta ${PORT}`);
    
    try {
        await query('SELECT 1');
        console.log(`✅ Banco de Dados  ${process.env.DB_NAME} conectado com sucesso!`);
    } catch (error) {
        console.error(`❌ FALHA NA CONEXÃO COM O BANCO DE DADOS:`);
        console.error(`   Motivo: ${error.message}`);
        console.error(`👉 Ajuste o arquivo .env com a senha correta do seu PostgreSQL.`);
    }
    console.log(`=================================\n`);
});
