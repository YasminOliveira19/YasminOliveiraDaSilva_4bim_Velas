
const { pool } = require('../database');

const configuracoes = {
    '200g': {
        preco: 'preco_200g',
        estoque: 'estoque_200g'
    },
    '400g': {
        preco: 'preco_400g',
        estoque: 'estoque_400g'
    },
    '600g': {
        preco: 'preco_600g',
        estoque: 'estoque_600g'
    }
};

// Verificar se o usuário é funcionário
async function verificarFuncionario(cpf) {
    const resultado = await pool.query(`
        SELECT pessoa_cpf_pessoa
        FROM funcionario
        WHERE pessoa_cpf_pessoa = $1
    `, [cpf]);

    return resultado.rows.length > 0;
}

// Normalizar tamanho do produto
function normalizarTamanho(tamanho) {
    return String(tamanho)
        .toLowerCase()
        .replace(/\s/g, '')
        .replace(/g$/, '') + 'g';
}

// Calcular valor da entrega
async function calcularEntrega(conexao, cpf) {
    const resultado = await conexao.query(`
        SELECT cidade, estado
        FROM endereco_cliente
        WHERE cliente_cpf = $1
    `, [cpf]);

    if (resultado.rows.length === 0) {
        throw new Error('O cliente precisa ter um endereço cadastrado.');
    }

    const cidade = resultado.rows[0].cidade
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

    const estado = resultado.rows[0].estado
        .trim()
        .toUpperCase();

    if (estado === 'PR' && cidade === 'campo mourao') {
        return 8;
    }

    if (estado === 'PR') {
        return 15;
    }

    return 25;
}

// Validar cliente
async function validarCliente(conexao, cpf) {
    const resultado = await conexao.query(`
        SELECT pessoa_cpf_pessoa
        FROM cliente
        WHERE pessoa_cpf_pessoa = $1
    `, [cpf]);

    if (resultado.rows.length === 0) {
        throw new Error('Cliente não encontrado.');
    }
}

// Validar forma de pagamento
function validarPagamento(forma_pagamento) {
    if (!['Pix', 'Cartão'].includes(forma_pagamento)) {
        throw new Error('Selecione uma forma de pagamento válida.');
    }
}

// Validar itens e retirar produtos do estoque
async function validarItens(conexao, itens) {
    if (!Array.isArray(itens) || itens.length === 0) {
        throw new Error('Adicione pelo menos um produto ao pedido.');
    }

    let subtotal = 0;
    const itensValidados = [];

    for (const item of itens) {
        const id_produto = Number(
            item.id_produto ?? item.produto_id
        );

        const quantidade = Number(item.quantidade);
        const tamanho = normalizarTamanho(item.tamanho);

        if (
            !Number.isInteger(id_produto) ||
            id_produto <= 0 ||
            !Number.isInteger(quantidade) ||
            quantidade <= 0
        ) {
            throw new Error('Produto ou quantidade inválida.');
        }

        const configuracao = configuracoes[tamanho];

        if (!configuracao) {
            throw new Error('Tamanho inválido.');
        }

        const resultado = await conexao.query(`
            SELECT
                id_produto,
                nome_produto,
                ${configuracao.preco} AS preco,
                ${configuracao.estoque} AS estoque
            FROM produto
            WHERE id_produto = $1
            FOR UPDATE
        `, [id_produto]);

        if (resultado.rows.length === 0) {
            throw new Error(`Produto ${id_produto} não encontrado.`);
        }

        const produto = resultado.rows[0];
        const preco = Number(produto.preco);
        const estoque = Number(produto.estoque);

        if (
            produto.preco === null ||
            !Number.isFinite(preco) ||
            preco < 0
        ) {
            throw new Error(
                `Preço inválido para ${produto.nome_produto}.`
            );
        }

        if (
            produto.estoque === null ||
            !Number.isInteger(estoque) ||
            estoque < quantidade
        ) {
            throw new Error(
                `Estoque insuficiente para ${produto.nome_produto} (${tamanho}).`
            );
        }

        const subtotal_item = preco * quantidade;

        subtotal += subtotal_item;

        // Retirar do estoque
        await conexao.query(`
            UPDATE produto
            SET ${configuracao.estoque} =
                ${configuracao.estoque} - $1
            WHERE id_produto = $2
        `, [quantidade, id_produto]);

        itensValidados.push({
            id_produto,
            nome_produto: produto.nome_produto,
            quantidade,
            tamanho,
            preco_unitario: preco,
            subtotal_item
        });
    }

    return {
        subtotal,
        itensValidados
    };
}

// Registrar itens do pedido
async function registrarItens(conexao, idPedido, itens) {
    for (const item of itens) {
        await conexao.query(`
            INSERT INTO item_pedido (
                pedido_id,
                produto_id,
                nome_produto,
                quantidade,
                tamanho,
                preco_unitario,
                subtotal_item
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            idPedido,
            item.id_produto,
            item.nome_produto,
            item.quantidade,
            item.tamanho,
            item.preco_unitario,
            item.subtotal_item
        ]);
    }
}

// Devolver produtos ao estoque
async function devolverEstoque(conexao, idPedido) {
    const resultado = await conexao.query(`
        SELECT produto_id, quantidade, tamanho
        FROM item_pedido
        WHERE pedido_id = $1
        ORDER BY produto_id, tamanho
    `, [idPedido]);

    for (const item of resultado.rows) {
        const tamanho = normalizarTamanho(item.tamanho);
        const configuracao = configuracoes[tamanho];

        if (!configuracao) {
            throw new Error('Tamanho de produto inválido.');
        }

        const atualizacao = await conexao.query(`
            UPDATE produto
            SET ${configuracao.estoque} =
                ${configuracao.estoque} + $1
            WHERE id_produto = $2
        `, [
            item.quantidade,
            item.produto_id
        ]);

        if (atualizacao.rowCount !== 1) {
            throw new Error(
                'Não foi possível devolver o produto ao estoque.'
            );
        }
    }
}

// Consulta utilizada na listagem e na busca por ID
const consultaPedidos = `
    SELECT
        p.*,
        pe.nome_pessoa AS nome_cliente,
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'produto_id', i.produto_id,
                        'nome_produto', i.nome_produto,
                        'quantidade', i.quantidade,
                        'tamanho', i.tamanho,
                        'preco_unitario', i.preco_unitario,
                        'subtotal_item', i.subtotal_item
                    )
                )
                FROM item_pedido i
                WHERE i.pedido_id = p.id_pedido
            ),
            '[]'::json
        ) AS itens
    FROM pedido p
    INNER JOIN pessoa pe
        ON p.cliente_cpf = pe.cpf_pessoa
`;

// Listar pedidos
exports.listarPedidos = async (req, res) => {
    try {
        const cpf = req.signedCookies.usuarioLumiere;

        if (!cpf) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para visualizar os pedidos.'
            });
        }

        const funcionario = await verificarFuncionario(cpf);

        const resultado = await pool.query(`
            ${consultaPedidos}
            ${funcionario ? '' : 'WHERE p.cliente_cpf = $1'}
            ORDER BY p.id_pedido DESC
        `, funcionario ? [] : [cpf]);

        res.json({
            sucesso: true,
            pedidos: resultado.rows
        });

    } catch (erro) {
        console.error('Erro ao listar pedidos:', erro);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar pedidos.'
        });
    }
};

// Obter pedido por ID
exports.obterPedido = async (req, res) => {
    try {
        const cpf = req.signedCookies.usuarioLumiere;
        const id = Number(req.params.id);

        if (!cpf) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para consultar o pedido.'
            });
        }

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID inválido.'
            });
        }

        const funcionario = await verificarFuncionario(cpf);

        const resultado = await pool.query(`
            ${consultaPedidos}
            WHERE p.id_pedido = $1
            ${funcionario ? '' : 'AND p.cliente_cpf = $2'}
        `, funcionario ? [id] : [id, cpf]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Pedido não encontrado.'
            });
        }

        res.json({
            sucesso: true,
            pedido: resultado.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao obter pedido:', erro);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao consultar pedido.'
        });
    }
};

// Criar pedido
exports.criarPedido = async (req, res) => {
    let conexao;

    try {
        const cpfUsuario = req.signedCookies.usuarioLumiere;

        if (!cpfUsuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para realizar o pedido.'
            });
        }

        const {
            id_pedido,
            cliente_cpf,
            forma_pagamento,
            itens
        } = req.body;

        const funcionario = await verificarFuncionario(cpfUsuario);

        const cpf = funcionario ? cliente_cpf : cpfUsuario;

        if (!cpf) {
            throw new Error('Selecione um cliente.');
        }

        const idInformado = Number(id_pedido);

        if (
            funcionario &&
            (!Number.isInteger(idInformado) || idInformado <= 0)
        ) {
            throw new Error('ID do pedido inválido.');
        }

        validarPagamento(forma_pagamento);

        conexao = await pool.connect();

        await conexao.query('BEGIN');

        // Serializa alterações de pedidos
        await conexao.query(`
            LOCK TABLE pedido IN SHARE ROW EXCLUSIVE MODE
        `);

        await validarCliente(conexao, cpf);

        if (funcionario) {
            const existente = await conexao.query(`
                SELECT id_pedido
                FROM pedido
                WHERE id_pedido = $1
            `, [idInformado]);

            if (existente.rows.length > 0) {
                throw new Error('Já existe um pedido com esse ID.');
            }
        }

        const valor_entrega = await calcularEntrega(conexao, cpf);

        const {
            subtotal,
            itensValidados
        } = await validarItens(conexao, itens);

        const valor_total = subtotal + valor_entrega;

        let resultado;

        if (funcionario) {
            resultado = await conexao.query(`
                INSERT INTO pedido (
                    id_pedido,
                    cliente_cpf,
                    forma_pagamento,
                    subtotal,
                    valor_entrega,
                    valor_total
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [
                idInformado,
                cpf,
                forma_pagamento,
                subtotal,
                valor_entrega,
                valor_total
            ]);

            // Atualizar sequência dos IDs automáticos
            await conexao.query(`
                SELECT setval(
                    pg_get_serial_sequence('pedido', 'id_pedido'),
                    GREATEST(
                        (SELECT MAX(id_pedido) FROM pedido),
                        nextval(
                            pg_get_serial_sequence(
                                'pedido', 'id_pedido'
                            )
                        )
                    )
                )
            `);

        } else {
            resultado = await conexao.query(`
                INSERT INTO pedido (
                    cliente_cpf,
                    forma_pagamento,
                    subtotal,
                    valor_entrega,
                    valor_total
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [
                cpf,
                forma_pagamento,
                subtotal,
                valor_entrega,
                valor_total
            ]);
        }

        const pedido = resultado.rows[0];

        await registrarItens(
            conexao,
            pedido.id_pedido,
            itensValidados
        );

        await conexao.query('COMMIT');

        res.status(201).json({
            sucesso: true,
            mensagem: 'Pedido realizado com sucesso!',
            pedido,
            id_pedido: pedido.id_pedido,
            subtotal,
            valor_entrega,
            valor_total
        });

    } catch (erro) {
        if (conexao) {
            await conexao.query('ROLLBACK');
        }

        console.error('Erro ao criar pedido:', erro);

        res.status(400).json({
            sucesso: false,
            mensagem: erro.message || 'Erro ao criar pedido.'
        });

    } finally {
        if (conexao) {
            conexao.release();
        }
    }
};

// Atualizar pedido
exports.atualizarPedido = async (req, res) => {
    let conexao;

    try {
        const cpfUsuario = req.signedCookies.usuarioLumiere;
        const id = Number(req.params.id);

        if (!cpfUsuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login.'
            });
        }

        if (!(await verificarFuncionario(cpfUsuario))) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso restrito aos funcionários.'
            });
        }

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('ID inválido.');
        }

        const {
            cliente_cpf,
            forma_pagamento,
            status_pedido,
            itens
        } = req.body;

        const statusPermitidos = [
            'Pendente',
            'Processando',
            'Enviado',
            'Entregue',
            'Cancelado'
        ];

        if (!statusPermitidos.includes(status_pedido)) {
            throw new Error('Status inválido.');
        }

        conexao = await pool.connect();

        await conexao.query('BEGIN');

        await conexao.query(`
            LOCK TABLE pedido IN SHARE ROW EXCLUSIVE MODE
        `);

        const resultado = await conexao.query(`
            SELECT *
            FROM pedido
            WHERE id_pedido = $1
            FOR UPDATE
        `, [id]);

        if (resultado.rows.length === 0) {
            throw new Error('Pedido não encontrado.');
        }

        const pedidoAtual = resultado.rows[0];

        const transicoes = {
            'Pendente': [
                'Pendente', 'Processando', 'Enviado', 'Cancelado'
            ],
            'Processando': [
                'Processando', 'Enviado', 'Cancelado'
            ],
            'Enviado': [
                'Enviado', 'Entregue'
            ],
            'Entregue': [],
            'Cancelado': []
        };

        if (!transicoes[pedidoAtual.status_pedido]?.includes(status_pedido)) {
            throw new Error('Alteração de status não permitida.');
        }

        // Cancelar sem excluir o pedido
        if (status_pedido === 'Cancelado') {
            await devolverEstoque(conexao, id);

            await conexao.query(`
                UPDATE pedido
                SET status_pedido = 'Cancelado'
                WHERE id_pedido = $1
            `, [id]);

            await conexao.query('COMMIT');

            return res.json({
                sucesso: true,
                mensagem: 'Pedido cancelado com sucesso!'
            });
        }

        // Pedidos enviados permitem apenas atualização do status
        if (pedidoAtual.status_pedido === 'Enviado') {
            await conexao.query(`
                UPDATE pedido
                SET status_pedido = $1
                WHERE id_pedido = $2
            `, [status_pedido, id]);

            await conexao.query('COMMIT');

            return res.json({
                sucesso: true,
                mensagem: 'Status atualizado com sucesso!'
            });
        }

        validarPagamento(forma_pagamento);

        await validarCliente(conexao, cliente_cpf);

        const valor_entrega = await calcularEntrega(
            conexao,
            cliente_cpf
        );

        // Devolver os itens anteriores ao estoque
        await devolverEstoque(conexao, id);

        // Validar os novos itens
        const {
            subtotal,
            itensValidados
        } = await validarItens(conexao, itens);

        const valor_total = subtotal + valor_entrega;

        // Atualizar dados do pedido
        const atualizacao = await conexao.query(`
            UPDATE pedido
            SET
                cliente_cpf = $1,
                forma_pagamento = $2,
                status_pedido = $3,
                subtotal = $4,
                valor_entrega = $5,
                valor_total = $6
            WHERE id_pedido = $7
            RETURNING *
        `, [
            cliente_cpf,
            forma_pagamento,
            status_pedido,
            subtotal,
            valor_entrega,
            valor_total,
            id
        ]);

        // Substituir os itens anteriores pelos novos
        await conexao.query(`
            DELETE FROM item_pedido
            WHERE pedido_id = $1
        `, [id]);

        await registrarItens(
            conexao,
            id,
            itensValidados
        );

        await conexao.query('COMMIT');

        res.json({
            sucesso: true,
            mensagem: 'Pedido alterado com sucesso!',
            pedido: atualizacao.rows[0]
        });

    } catch (erro) {
        if (conexao) {
            await conexao.query('ROLLBACK');
        }

        console.error('Erro ao atualizar pedido:', erro);

        res.status(400).json({
            sucesso: false,
            mensagem: erro.message || 'Erro ao atualizar pedido.'
        });

    } finally {
        if (conexao) {
            conexao.release();
        }
    }
};

// Cancelar pedido
exports.cancelarPedido = async (req, res) => {
    let conexao;

    try {
        const cpf = req.signedCookies.usuarioLumiere;
        const id = Number(req.params.id);

        if (!cpf) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login para cancelar o pedido.'
            });
        }

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('ID inválido.');
        }

        const funcionario = await verificarFuncionario(cpf);

        conexao = await pool.connect();

        await conexao.query('BEGIN');

        await conexao.query(`
            LOCK TABLE pedido IN SHARE ROW EXCLUSIVE MODE
        `);

        const resultado = await conexao.query(`
            SELECT *
            FROM pedido
            WHERE id_pedido = $1
            ${funcionario ? '' : 'AND cliente_cpf = $2'}
            FOR UPDATE
        `, funcionario ? [id] : [id, cpf]);

        if (resultado.rows.length === 0) {
            throw new Error('Pedido não encontrado.');
        }

        const pedido = resultado.rows[0];

        if (
            !['Pendente', 'Processando']
                .includes(pedido.status_pedido)
        ) {
            throw new Error('Este pedido não pode mais ser cancelado.');
        }

        await devolverEstoque(conexao, id);

        await conexao.query(`
            UPDATE pedido
            SET status_pedido = 'Cancelado'
            WHERE id_pedido = $1
        `, [id]);

        await conexao.query('COMMIT');

        res.json({
            sucesso: true,
            mensagem: 'Pedido cancelado com sucesso!'
        });

    } catch (erro) {
        if (conexao) {
            await conexao.query('ROLLBACK');
        }

        console.error('Erro ao cancelar pedido:', erro);

        res.status(400).json({
            sucesso: false,
            mensagem: erro.message || 'Erro ao cancelar pedido.'
        });

    } finally {
        if (conexao) {
            conexao.release();
        }
    }
};
