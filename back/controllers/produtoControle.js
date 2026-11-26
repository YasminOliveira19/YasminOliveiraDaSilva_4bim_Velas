const { query } = require('../database');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Listar todos os produtos

exports.listarProdutos = async (req, res) => {
    try {
        console.log('TESTE: NOVA FUNÇÃO listarProdutos');
        const result = await query(`
            SELECT
                p.*,
                c.nome_categoria AS nome_categoria,
                u.nome_unidade_medida AS nome_unidade_medida
            FROM public.produto p
            LEFT JOIN public.categoria c
                ON p.id_categoria = c.id_categoria
            LEFT JOIN public.unidade_medida u
                ON p.id_unidade_medida = u.id_unidade_medida
            ORDER BY p.id_produto
        `);

        res.json({
            sucesso: true,
            produtos: result.rows
        });

    } catch (error) {
        console.error('Erro ao listar produtos:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar produtos.'
        });
    }
};

// Obter produto por ID
exports.obterProduto = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID inválido.'
            });
        }

        const result = await query(
            'SELECT * FROM public.produto WHERE id_produto = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Produto não encontrado.'
            });
        }

        res.json({
            sucesso: true,
            produto: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao obter produto:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor.'
        });
    }
};

// Criar produto
exports.criarProduto = async (req, res) => {
    try {
        const {
            nome_produto,
            id_tipo_produto,
            id_categoria,
            preco_200g,
            preco_400g,
            preco_600g,
            estoque_200g,
            estoque_400g,
            estoque_600g
        } = req.body;

        if (!nome_produto || !id_tipo_produto || !id_categoria) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha o nome, o tipo e a categoria do produto.'
            });
        }

        const precos = [preco_200g, preco_400g, preco_600g].map(Number);
        const estoques = [estoque_200g, estoque_400g, estoque_600g].map(Number);

        if (precos.some(p => !Number.isFinite(p) || p < 0)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe preços válidos para os três tamanhos.'
            });
        }

        if (estoques.some(e => !Number.isInteger(e) || e < 0)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe estoques inteiros e válidos para os três tamanhos.'
            });
        }

        const sql = `
            INSERT INTO public.produto (
                nome_produto,
                estoque,
                id_tipo_produto,
                id_categoria,
                id_unidade_medida,
                preco_produto,
                preco_200g,
                preco_400g,
                preco_600g,
                estoque_200g,
                estoque_400g,
                estoque_600g
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const values = [
            nome_produto,
            estoques[0],
            id_tipo_produto,
            id_categoria,
            1,
            precos[0],
            precos[0],
            precos[1],
            precos[2],
            estoques[0],
            estoques[1],
            estoques[2]
        ];

        const result = await query(sql, values);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Produto inserido com sucesso!',
            produto: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar produto:', error);

        if (error.code === '23503') {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O tipo ou a categoria informada não existe.'
            });
        }
        

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao inserir produto no banco de dados.'
        });
    }
};

// Atualizar produto
exports.atualizarProduto = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID inválido.'
            });
        }

        const {
            nome_produto,
            id_tipo_produto,
            id_categoria,
            preco_200g,
            preco_400g,
            preco_600g,
            estoque_200g,
            estoque_400g,
            estoque_600g
        } = req.body;

        if (!nome_produto || !id_tipo_produto || !id_categoria) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha o nome, o tipo e a categoria do produto.'
            });
        }

        const precos = [preco_200g, preco_400g, preco_600g].map(Number);
        const estoques = [estoque_200g, estoque_400g, estoque_600g].map(Number);

        if (precos.some(p => !Number.isFinite(p) || p < 0)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe preços válidos para os três tamanhos.'
            });
        }

        if (estoques.some(e => !Number.isInteger(e) || e < 0)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe estoques inteiros e válidos para os três tamanhos.'
            });
        }

        const sql = `
            UPDATE public.produto
            SET
                nome_produto = $1,
                estoque = $2,
                id_tipo_produto = $3,
                id_categoria = $4,
                id_unidade_medida = $5,
                preco_produto = $6,
                preco_200g = $7,
                preco_400g = $8,
                preco_600g = $9,
                estoque_200g = $10,
                estoque_400g = $11,
                estoque_600g = $12
            WHERE id_produto = $13
            RETURNING *
        `;

        const values = [
            nome_produto,
            estoques[0],
            id_tipo_produto,
            id_categoria,
            1,
            precos[0],
            precos[0],
            precos[1],
            precos[2],
            estoques[0],
            estoques[1],
            estoques[2],
            id
        ];

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Produto não encontrado.'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Produto alterado com sucesso!',
            produto: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar produto:', error);

        if (error.code === '23503') {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O tipo ou a categoria informada não existe.'
            });
        }

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar produto.'
        });
    }
};

// Upload e salvamento de imagem
exports.uploadImagem = async (req, res) => {
    try {
        const id = req.params.id;

        if (!req.file) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nenhum arquivo enviado.'
            });
        }

        const pastaImagens = path.join(
            __dirname,
            '../../front/Visão ADM/imagens'
        );

        if (!fs.existsSync(pastaImagens)) {
            fs.mkdirSync(pastaImagens, {
                recursive: true
            });
        }

        const caminhoDestino = path.join(
            pastaImagens,
            `${id}.png`
        );

        await sharp(req.file.buffer)
            .resize(300, 300, {
                fit: 'cover'
            })
            .toFormat('png')
            .toFile(caminhoDestino);

        res.json({
            sucesso: true,
            mensagem: 'Imagem salva com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao salvar imagem:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao processar imagem.'
        });
    }
};

// Deletar produto
exports.deletarProduto = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        await query(
            'DELETE FROM public.produto WHERE id_produto = $1',
            [id]
        );

        const imgPath = path.join(
            __dirname,
            '../../front/Visão ADM/imagens',
            `${id}.png`
        );

        if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
        }

        res.json({
            sucesso: true,
            mensagem: 'Produto excluído com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao deletar produto:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao excluir produto.'
        });
    }
};

// Listar tipos de produto
// Listar tipos de produto
exports.listarTiposProduto = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM public.tipo_produto ORDER BY id_tipo_produto'
        );

        res.json({
            sucesso: true,
            tipos: result.rows
        });

    } catch (error) {
        console.error('Erro ao listar tipos:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar tipos de produto.'
        });
    }
};