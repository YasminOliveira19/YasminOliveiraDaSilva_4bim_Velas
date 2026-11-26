const { query } = require('../database');

const verificarGerente = async (req, res, next) => {
    try {
        const cpf = req.signedCookies.usuarioLumiere;

        if (!cpf) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para continuar.'
            });
        }

        const result = await query(`
            SELECT cargo_id_cargo
            FROM funcionario
            WHERE pessoa_cpf_pessoa = $1
        `, [cpf]);

        if (
            result.rows.length === 0 ||
            Number(result.rows[0].cargo_id_cargo) !== 1
        ) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso permitido somente ao gerente.'
            });
        }

        next();

    } catch (error) {
        console.error('Erro ao verificar permissão:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao verificar permissão de acesso.'
        });
    }
};

module.exports = verificarGerente;