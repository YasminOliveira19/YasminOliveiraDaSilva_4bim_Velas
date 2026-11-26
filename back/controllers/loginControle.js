
const { query } = require('../database');

const opcoesCookie = {
    httpOnly: true,
    signed: true,
    sameSite: 'lax',
    secure: false, // false no ambiente local
    path: '/',
    maxAge: 2 * 60 * 60 * 1000 // 2 horas
};

// Realizar login
exports.login = async (req, res) => {
    try {
        const { cpf_pessoa, senha_pessoa } = req.body;

        if (!cpf_pessoa || !senha_pessoa) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o CPF e a senha.'
            });
        }

        const result = await query(`
            SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa,
                f.pessoa_cpf_pessoa AS cpf_funcionario,
                c.nome_cargo,
                cl.pessoa_cpf_pessoa AS cpf_cliente
            FROM pessoa p
            LEFT JOIN funcionario f
                ON f.pessoa_cpf_pessoa = p.cpf_pessoa
            LEFT JOIN cargo c
                ON c.id_cargo = f.cargo_id_cargo
            LEFT JOIN cliente cl
                ON cl.pessoa_cpf_pessoa = p.cpf_pessoa
            WHERE p.cpf_pessoa = $1
            AND p.senha_pessoa = $2
        `, [cpf_pessoa, senha_pessoa]);

        console.log("Resultado: " + result.rows.length)
        if (result.rows.length === 0) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'CPF ou senha inválidos.'
            });
        }

        const pessoa = result.rows[0];

        const ehFuncionario = pessoa.cpf_funcionario !== null;
        const ehCliente = pessoa.cpf_cliente !== null;

        if (!ehFuncionario && !ehCliente) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Usuário sem permissão de acesso.'
            });
        }

        const usuario = {
            cpf_pessoa: pessoa.cpf_pessoa,
            nome_pessoa: pessoa.nome_pessoa,
            email_pessoa: pessoa.email_pessoa
        };

        if (ehFuncionario) {
            usuario.nome_cargo = pessoa.nome_cargo;
        }

        // Cria cookie assinado com o CPF da pessoa
        res.cookie('usuarioLumiere', pessoa.cpf_pessoa, opcoesCookie);

        let opcoes = [];

        if (ehCliente) {
            opcoes.push('cliente');
        }

        if (ehFuncionario) {
            opcoes.push('funcionario');
        }

        return res.json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso!',
            usuario,
            opcoes
        });

    } catch (error) {
        console.error('Erro ao realizar login:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor.'
        });
    }
};

// Verificar usuário conectado
exports.verificarSessao = async (req, res) => {
    try {
        const cpf = req.signedCookies.usuarioLumiere;

        if (!cpf) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Nenhum usuário conectado.'
            });
        }

        const result = await query(`
            SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa,
                f.pessoa_cpf_pessoa AS cpf_funcionario,
                c.nome_cargo,
                cl.pessoa_cpf_pessoa AS cpf_cliente
            FROM pessoa p
            LEFT JOIN funcionario f
                ON f.pessoa_cpf_pessoa = p.cpf_pessoa
            LEFT JOIN cargo c
                ON c.id_cargo = f.cargo_id_cargo
            LEFT JOIN cliente cl
                ON cl.pessoa_cpf_pessoa = p.cpf_pessoa
            WHERE p.cpf_pessoa = $1
        `, [cpf]);

        if (result.rows.length === 0) {
            res.clearCookie('usuarioLumiere', opcoesCookie);

            return res.status(401).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado.'
            });
        }

        const pessoa = result.rows[0];

        const opcoes = [];

        if (pessoa.cpf_cliente) opcoes.push('cliente');
        if (pessoa.cpf_funcionario) opcoes.push('funcionario');

        return res.json({
            sucesso: true,
            usuario: {
                cpf_pessoa: pessoa.cpf_pessoa,
                nome_pessoa: pessoa.nome_pessoa,
                email_pessoa: pessoa.email_pessoa,
                nome_cargo: pessoa.nome_cargo
            },
            opcoes
        });

    } catch (error) {
        console.error('Erro ao verificar usuário:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor.'
        });
    }
};

// Encerrar login
exports.logout = (req, res) => {
    res.clearCookie('usuarioLumiere', {
        httpOnly: true,
        signed: true,
        sameSite: 'lax',
        secure: false,
        path: '/'
    });

    return res.json({
        sucesso: true,
        mensagem: 'Logout realizado com sucesso!'
    });
};


// Atualizar dados do perfil
exports.atualizarPerfil = async (req, res) => {
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
                mensagem: 'Preencha o nome e o e-mail.'
            });
        }

        const nome = nome_pessoa.trim();
        const email = email_pessoa.trim();

        if (nome.length < 3) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe um nome válido.'
            });
        }

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailValido.test(email)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe um e-mail válido.'
            });
        }

        const result = await query(`
            UPDATE pessoa
            SET nome_pessoa = $1,
                email_pessoa = $2
            WHERE cpf_pessoa = $3
            RETURNING cpf_pessoa, nome_pessoa, email_pessoa
        `, [nome, email, cpf]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Pessoa não encontrada.'
            });
        }

        return res.json({
            sucesso: true,
            mensagem: 'Perfil atualizado com sucesso!',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno ao atualizar o perfil.'
        });
    }
};
