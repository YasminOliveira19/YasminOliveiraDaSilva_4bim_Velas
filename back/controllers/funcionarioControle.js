
const { query } = require('../database');

// Listar funcionários
exports.listarFuncionarios = async (req, res) => {
    try {
        const result = await query(`
            SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa,
                f.cargo_id_cargo,
                c.nome_cargo
            FROM funcionario f
            INNER JOIN pessoa p
                ON p.cpf_pessoa = f.pessoa_cpf_pessoa
            INNER JOIN cargo c
                ON c.id_cargo = f.cargo_id_cargo
            ORDER BY p.nome_pessoa
        `);

        return res.json({
            sucesso: true,
            funcionarios: result.rows
        });

    } catch (error) {
        console.error('Erro ao listar funcionários:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar funcionários.'
        });
    }
};


// Buscar cliente pelo CPF para promoção
exports.obterClienteParaPromocao = async (req, res) => {
    try {
        const cpf = req.params.id;

        const result = await query(`
            SELECT
                p.cpf_pessoa,
                p.nome_pessoa,
                p.email_pessoa
            FROM cliente cl
            INNER JOIN pessoa p
                ON p.cpf_pessoa = cl.pessoa_cpf_pessoa
            WHERE p.cpf_pessoa = $1
            AND NOT EXISTS (
                SELECT 1
                FROM funcionario f
                WHERE f.pessoa_cpf_pessoa = p.cpf_pessoa
            )
        `, [cpf]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cliente não encontrado ou já é funcionário.'
            });
        }

        return res.json({
            sucesso: true,
            cliente: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao procurar cliente:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao procurar cliente.'
        });
    }
};


// Promover cliente a funcionário
exports.promoverFuncionario = async (req, res) => {
    try {
        const { cpf_pessoa, cargo_id_cargo } = req.body;

        if (!cpf_pessoa || !cargo_id_cargo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o CPF e o cargo.'
            });
        }

        const cliente = await query(`
            SELECT pessoa_cpf_pessoa
            FROM cliente
            WHERE pessoa_cpf_pessoa = $1
        `, [cpf_pessoa]);

        if (cliente.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Este CPF não pertence a um cliente cadastrado.'
            });
        }

        const existente = await query(`
            SELECT pessoa_cpf_pessoa
            FROM funcionario
            WHERE pessoa_cpf_pessoa = $1
        `, [cpf_pessoa]);

        if (existente.rows.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: 'Esta pessoa já é funcionária.'
            });
        }

        const cargo = await query(`
            SELECT id_cargo
            FROM cargo
            WHERE id_cargo = $1
        `, [cargo_id_cargo]);

        if (cargo.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cargo não encontrado.'
            });
        }

        await query(`
            INSERT INTO funcionario (
                pessoa_cpf_pessoa,
                cargo_id_cargo
            )
            VALUES ($1, $2)
        `, [cpf_pessoa, cargo_id_cargo]);

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Cliente promovido a funcionário com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao promover funcionário:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao promover cliente.'
        });
    }
};


// Alterar cargo do funcionário
exports.atualizarFuncionario = async (req, res) => {
    try {
        const cpf = req.params.id;
        const { cargo_id_cargo } = req.body;

        if (!cargo_id_cargo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o novo cargo.'
            });
        }

        const cargo = await query(`
        SELECT id_cargo
        FROM cargo
        WHERE id_cargo = $1
        `, [cargo_id_cargo]);

        if (cargo.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Cargo não encontrado.'
            });
        }

        const result = await query(`
            UPDATE funcionario
            SET cargo_id_cargo = $1
            WHERE pessoa_cpf_pessoa = $2
            RETURNING *
        `, [cargo_id_cargo, cpf]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Funcionário não encontrado.'
            });
        }

        return res.json({
            sucesso: true,
            mensagem: 'Cargo alterado com sucesso!',
            funcionario: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao alterar cargo:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao alterar cargo.'
        });
    }
};


// Remover vínculo de funcionário
exports.deletarFuncionario = async (req, res) => {
    try {
        const cpf = req.params.id;

        const result = await query(`
            DELETE FROM funcionario
            WHERE pessoa_cpf_pessoa = $1
            RETURNING pessoa_cpf_pessoa
        `, [cpf]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Funcionário não encontrado.'
            });
        }

        return res.json({
            sucesso: true,
            mensagem: 'Funcionário removido. O cadastro de cliente foi mantido.'
        });

    } catch (error) {
        console.error('Erro ao remover funcionário:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao remover funcionário.'
        });
    }
};

// Listar cargos disponíveis
exports.listarCargos = async (req, res) => {
    try {
        const result = await query(`
            SELECT id_cargo, nome_cargo
            FROM cargo
            ORDER BY nome_cargo
        `);

        return res.json({
            sucesso: true,
            cargos: result.rows
        });

    } catch (error) {
        console.error('Erro ao listar cargos:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar cargos.'
        });
    }
};