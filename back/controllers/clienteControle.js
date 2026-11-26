const { query } = require('../database');

// Listar todos os clientes
exports.listarClientes = async (req, res) => {
    try {
        const result = await query(`
            SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa
            FROM cliente c
            INNER JOIN pessoa p
                ON p.cpf_pessoa = c.pessoa_cpf_pessoa
            ORDER BY p.cpf_pessoa
        `);

        res.json({
            sucesso: true,
            clientes: result.rows
        });

    } catch (error) {
        console.error('Erro ao listar clientes:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar clientes.'
        });
    }
};


// Procurar cliente pelo CPF
exports.obterCliente = async (req, res) => {
    try {
        const cpf = req.params.id;

        const result = await query(`
            SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa
            FROM cliente c
            INNER JOIN pessoa p
                ON p.cpf_pessoa = c.pessoa_cpf_pessoa
            WHERE p.cpf_pessoa = $1
        `, [cpf]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cliente não encontrado.'
            });
        }

        res.json({
            sucesso: true,
            cliente: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao obter cliente:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor.'
        });
    }
};


// Criar cliente
exports.criarCliente = async (req, res) => {
    try {
     const {
    cpf_pessoa,
    nome_pessoa,
    email_pessoa,
    senha_pessoa
} = req.body;

if (!cpf_pessoa || !nome_pessoa || !email_pessoa || !senha_pessoa) {
    return res.status(400).json({
        sucesso: false,
        mensagem: 'Preencha todos os campos.'
    });
}

await query(`
    INSERT INTO pessoa (
        cpf_pessoa,
        nome_pessoa,
        senha_pessoa,
        email_pessoa
    )
    VALUES ($1, $2, $3, $4)
`, [
    cpf_pessoa,
    nome_pessoa,
    senha_pessoa,
    email_pessoa
]);

        // Depois identifica essa pessoa como cliente
        const result = await query(`
            INSERT INTO cliente (pessoa_cpf_pessoa)
            VALUES ($1)
            RETURNING *
        `, [cpf_pessoa]);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Cliente inserido com sucesso!',
            cliente: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar cliente:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao inserir cliente no banco de dados.'
        });
    }
};

// Cadastro de cliente pela página de cadastro
exports.cadastrarCliente = async (req, res) => {
    try {
        const {
            cpf_pessoa,
            nome_pessoa,
            email_pessoa,
            senha_pessoa
        } = req.body;

        if (!cpf_pessoa || !nome_pessoa || !email_pessoa || !senha_pessoa) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha todos os campos.'
            });
        }

        if (!/^\d{11}$/.test(cpf_pessoa)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O CPF deve conter 11 números.'
            });
        }

        // Verifica se o CPF já está cadastrado
        const existente = await query(`
            SELECT cpf_pessoa
            FROM pessoa
            WHERE cpf_pessoa = $1
        `, [cpf_pessoa]);

        if (existente.rows.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: 'Este CPF já está cadastrado.'
            });
        }

        // Cadastra os dados da pessoa
        await query(`
            INSERT INTO pessoa (
                cpf_pessoa,
                nome_pessoa,
                senha_pessoa,
                email_pessoa
            )
            VALUES ($1, $2, $3, $4)
        `, [
            cpf_pessoa,
            nome_pessoa,
            senha_pessoa,
            email_pessoa
        ]);

        // Identifica a pessoa como cliente
        await query(`
            INSERT INTO cliente (pessoa_cpf_pessoa)
            VALUES ($1)
        `, [cpf_pessoa]);

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Conta criada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao realizar o cadastro.'
        });
    }
};

// Alterar cliente
exports.atualizarCliente = async (req, res) => {
    try {
        const cpf = req.params.id;

        const {
            nome_pessoa,
            email_pessoa
        } = req.body;

        const result = await query(`
            UPDATE pessoa
            SET
                nome_pessoa = $1,
                email_pessoa = $2
            WHERE cpf_pessoa = $3
            AND EXISTS (
                SELECT 1
                FROM cliente
                WHERE pessoa_cpf_pessoa = $3
            )
            RETURNING *
        `, [
            nome_pessoa,
            email_pessoa,
            cpf
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cliente não encontrado.'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Cliente alterado com sucesso!',
            cliente: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar cliente.'
        });
    }
};


// Excluir cliente
exports.deletarCliente = async (req, res) => {
    try {
        const cpf = req.params.id;

        await query(`
            DELETE FROM cliente
            WHERE pessoa_cpf_pessoa = $1
        `, [cpf]);

        res.json({
            sucesso: true,
            mensagem: 'Cliente excluído com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao deletar cliente:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao excluir cliente.'
        });
    }
};


 // Consultar perfil do cliente autenticado
exports.consultarMeuPerfil = async (req, res) => {
    try {
        const cpf = req.signedCookies.usuarioLumiere;

        if (!cpf) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para acessar seu perfil.'
            });
        }

        const result = await query(`
            SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa
            FROM pessoa p
            INNER JOIN cliente c
                ON c.pessoa_cpf_pessoa = p.cpf_pessoa
            WHERE p.cpf_pessoa = $1
        `, [cpf]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Perfil de cliente não encontrado.'
            });
        }

        return res.json({
            sucesso: true,
            cliente: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao consultar perfil:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao consultar perfil.'
        });
    }
};


// Atualizar perfil do cliente autenticado
exports.atualizarMeuPerfil = async (req, res) => {
    try {
        const cpf = req.signedCookies.usuarioLumiere;

        if (!cpf) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para atualizar seu perfil.'
            });
        }

        const { nome_pessoa, email_pessoa } = req.body;

        if (!nome_pessoa || !email_pessoa) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o nome e o e-mail.'
            });
        }

        const result = await query(`
            UPDATE pessoa
            SET
                nome_pessoa = $1,
                email_pessoa = $2
            WHERE cpf_pessoa = $3
            AND EXISTS (
                SELECT 1
                FROM cliente
                WHERE pessoa_cpf_pessoa = $3
            )
            RETURNING cpf_pessoa, nome_pessoa, email_pessoa
        `, [
            nome_pessoa.trim(),
            email_pessoa.trim(),
            cpf
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Perfil de cliente não encontrado.'
            });
        }

        return res.json({
            sucesso: true,
            mensagem: 'Perfil atualizado com sucesso!',
            cliente: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar perfil.'
        });
    }
};
