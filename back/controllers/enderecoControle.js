
const { query } = require('../database');

// Cadastrar ou atualizar endereço do cliente
exports.salvarEndereco = async (req, res) => {
    try {
        const cpf = req.signedCookies.usuarioLumiere;

        if (!cpf) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para cadastrar seu endereço.'
            });
        }

        const {
            rua,
            numero,
            complemento,
            bairro,
            cidade,
            estado
        } = req.body;

        if (!rua || !numero || !bairro || !cidade || !estado) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha todos os campos obrigatórios.'
            });
        }

        if (!/^[A-Za-z]{2}$/.test(estado)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe uma sigla de estado válida.'
            });
        }

        await query(`
            INSERT INTO endereco_cliente
            (cliente_cpf, rua, numero, complemento, bairro, cidade, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7)

            ON CONFLICT (cliente_cpf)
            DO UPDATE SET
                rua = EXCLUDED.rua,
                numero = EXCLUDED.numero,
                complemento = EXCLUDED.complemento,
                bairro = EXCLUDED.bairro,
                cidade = EXCLUDED.cidade,
                estado = EXCLUDED.estado
        `, [
            cpf,
            rua.trim(),
            numero.trim(),
            complemento ? complemento.trim() : null,
            bairro.trim(),
            cidade.trim(),
            estado.toUpperCase()
        ]);

        return res.json({
            sucesso: true,
            mensagem: 'Endereço salvo com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao salvar endereço:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao salvar o endereço.'
        });
    }
};
// Buscar endereço do cliente conectado
exports.buscarEndereco = async (req, res) => {
    try {
        const cpf = req.signedCookies.usuarioLumiere;

        if (!cpf) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para continuar.'
            });
        }

        const resultado = await query(`
            SELECT
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                estado
            FROM endereco_cliente
            WHERE cliente_cpf = $1
        `, [cpf]);

        if (resultado.rows.length === 0) {
            return res.json({
                sucesso: true,
                endereco: null
            });
        }

        return res.json({
            sucesso: true,
            endereco: resultado.rows[0]
        });

    } catch (error) {
        console.error('Erro ao buscar endereço:', error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar endereço.'
        });
    }
};