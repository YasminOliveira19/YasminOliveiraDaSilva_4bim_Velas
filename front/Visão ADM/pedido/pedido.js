
const URL_API = 'http://127.0.0.1:3001';

let oQueEstaFazendo = '';
let pedido = null;
let itens = [];
let salvando = false;
let adicionando = false;

bloquearAtributos(true);

// Inicializar página
async function inicializar() {

    const linkConta = document.getElementById('linkConta');
    const textoConta = document.getElementById('textoConta');

    const usuarioConta = JSON.parse(
        sessionStorage.getItem('usuarioLumiere')
    );

    if (usuarioConta && usuarioConta.cpf_pessoa) {
        linkConta.href = '../../Visão Cliente/perfil/perfil.html';
        linkConta.setAttribute('aria-label', 'Meu perfil');
        textoConta.textContent = 'Meu perfil';
    }

    await listar();
}

// Formatar valores
function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Formatar data
function formatarData(data) {
    return data
        ? new Date(data).toLocaleString('pt-BR')
        : '';
}

// Procurar pela chave primária
async function procurePorChavePrimaria(chave) {

    const resposta = await fetch(`${URL_API}/pedido/${chave}`, {
        credentials: 'include'
    });

    const dados = await resposta.json();

    if (resposta.status === 404) {
        return null;
    }

    if (!resposta.ok || !dados.sucesso) {
        throw new Error(
            dados.mensagem || 'Erro ao consultar pedido.'
        );
    }

    return dados.pedido;
}

// Procurar pedido
async function procure() {

    const id_pedido = document
        .getElementById('inputId_pedido').value.trim();

    if (
        id_pedido === '' ||
        !Number.isInteger(Number(id_pedido)) ||
        Number(id_pedido) <= 0
    ) {
        mostrarAviso('Precisa ser um número inteiro positivo.');
        return;
    }

    limparAtributos();

    visibilidadeDosBotoes(
        'inline', 'none', 'none', 'none'
    );

    try {

        pedido = await procurePorChavePrimaria(id_pedido);

        if (pedido) {

            mostrarDadosPedido(pedido);

            const podeAlterar =
                pedido.status_pedido !== 'Cancelado' &&
                pedido.status_pedido !== 'Entregue';

            visibilidadeDosBotoes(
                'inline',
                'none',
                podeAlterar ? 'inline' : 'none',
                'none'
            );

            mostrarAviso(
                podeAlterar
                    ? 'Achou no banco, pode alterar.'
                    : 'Pedido finalizado. Disponível para consulta.'
            );

        } else {

            limparAtributos();

            visibilidadeDosBotoes(
                'inline', 'inline', 'none', 'none'
            );

            mostrarAviso(
                'Não achou no banco, pode inserir.'
            );
        }

    } catch (erro) {

        console.error(erro);
        mostrarAviso(erro.message);
    }
}

// Inserir pedido
function inserir() {

    oQueEstaFazendo = 'inserindo';

    bloquearAtributos(false);

    document.getElementById('inputStatus').value = 'Pendente';
    document.getElementById('inputStatus').disabled = true;

    visibilidadeDosBotoes(
        'none', 'none', 'none', 'inline'
    );

    mostrarAviso(
        'INSERINDO - Digite os atributos, adicione os produtos e clique em Salvar.'
    );
}

// Alterar pedido
function alterar() {

    if (!pedido) return;

    if (
        pedido.status_pedido === 'Cancelado' ||
        pedido.status_pedido === 'Entregue'
    ) {
        mostrarAviso('Este pedido não pode mais ser alterado.');
        return;
    }

    oQueEstaFazendo = 'alterando';

    bloquearAtributos(false);

    if (pedido.status_pedido === 'Enviado') {

        document.getElementById('inputCliente').readOnly = true;
        document.getElementById('inputPagamento').disabled = true;
        document.getElementById('formItens').style.display = 'none';

        mostrarAviso(
            'ALTERANDO - Apenas o status pode ser alterado.'
        );

    } else {

        mostrarAviso(
            'ALTERANDO - Altere os atributos e clique em Salvar.'
        );
    }

    configurarStatus();

    visibilidadeDosBotoes(
        'none', 'none', 'none', 'inline'
    );

    mostrarItens();
}

// Configurar status permitidos
function configurarStatus() {

    const status = document.getElementById('inputStatus');

    const transicoes = {
        'Pendente': [
            'Pendente',
            'Processando',
            'Enviado',
            'Cancelado'
        ],
        'Processando': [
            'Processando',
            'Enviado',
            'Cancelado'
        ],
        'Enviado': [
            'Enviado',
            'Entregue'
        ]
    };

    const permitidos =
        transicoes[pedido.status_pedido] || [];

    for (const opcao of status.options) {
        opcao.disabled = !permitidos.includes(opcao.value);
    }
}

// Verificar se os itens podem ser editados
function podeEditarItens() {

    return oQueEstaFazendo === 'inserindo' ||
        (
            oQueEstaFazendo === 'alterando' &&
            pedido &&
            ['Pendente', 'Processando']
                .includes(pedido.status_pedido)
        );
}

// Adicionar produto ao pedido
async function adicionarItem() {

    if (!podeEditarItens() || salvando || adicionando) return;

    const id_produto = Number(
        document.getElementById('inputProduto').value
    );

    const tamanho = document
        .getElementById('inputTamanho').value;

    const quantidade = Number(
        document.getElementById('inputQuantidade').value
    );

    if (
        !Number.isInteger(id_produto) ||
        id_produto <= 0 ||
        !Number.isInteger(quantidade) ||
        quantidade <= 0
    ) {
        mostrarAviso('Informe um produto e uma quantidade válidos.');
        return;
    }

    adicionando = true;

    document.getElementById('btAdicionar').disabled = true;
    document.getElementById('btSalvar').disabled = true;

    try {

        const resposta = await fetch(
            `${URL_API}/produto/${id_produto}`,
            {
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || 'Produto não encontrado.'
            );
        }

        if (!podeEditarItens()) return;

        const produto = dados.produto;

        const preco = Number(produto[`preco_${tamanho}`]);
        const estoque = Number(produto[`estoque_${tamanho}`]);

        if (
            produto[`preco_${tamanho}`] == null ||
            !Number.isFinite(preco) ||
            preco < 0
        ) {
            throw new Error('Preço do produto inválido.');
        }

        if (
            produto[`estoque_${tamanho}`] == null ||
            !Number.isInteger(estoque) ||
            estoque < 0
        ) {
            throw new Error('Estoque do produto inválido.');
        }

        const existente = itens.find(item =>
            Number(item.produto_id) === id_produto &&
            item.tamanho === tamanho
        );

        // Considera os produtos reservados no pedido original
        const quantidadeAnterior = (pedido?.itens || [])
            .filter(item =>
                Number(item.produto_id) === id_produto &&
                item.tamanho === tamanho
            )
            .reduce(
                (total, item) => total + Number(item.quantidade),
                0
            );

        const quantidadeAtual = itens
            .filter(item =>
                Number(item.produto_id) === id_produto &&
                item.tamanho === tamanho
            )
            .reduce(
                (total, item) => total + Number(item.quantidade),
                0
            );

        const estoqueDisponivel = estoque + quantidadeAnterior;

        if (quantidadeAtual + quantidade > estoqueDisponivel) {
            throw new Error('Estoque insuficiente.');
        }

        if (existente) {

            existente.quantidade += quantidade;
            existente.preco_unitario = preco;

            existente.subtotal_item =
                existente.quantidade * preco;

        } else {

            itens.push({
                produto_id: id_produto,
                nome_produto: produto.nome_produto,
                tamanho,
                quantidade,
                preco_unitario: preco,
                subtotal_item: preco * quantidade
            });
        }

        mostrarItens();
        calcularSubtotal();

        document.getElementById('inputProduto').value = '';
        document.getElementById('inputQuantidade').value = 1;

        mostrarAviso('Produto adicionado ao pedido.');

    } catch (erro) {

        console.error(erro);
        mostrarAviso(erro.message);

    } finally {

        adicionando = false;

        document.getElementById('btAdicionar').disabled = false;
        document.getElementById('btSalvar').disabled = false;
    }
}

// Remover item antes de salvar
function removerItem(indice) {

    if (!podeEditarItens() || salvando || adicionando) return;

    itens.splice(indice, 1);

    mostrarItens();
    calcularSubtotal();

    mostrarAviso('Produto removido do pedido.');
}

// Mostrar itens
function mostrarItens() {

    const saida = document.getElementById('itensPedido');

    saida.innerHTML = '';

    if (itens.length === 0) {
        saida.textContent = 'Nenhum item selecionado.';
        return;
    }

    itens.forEach((item, indice) => {

        const div = document.createElement('div');
        div.className = 'item-pedido';

        const titulo = document.createElement('strong');

        titulo.textContent =
            `${item.produto_id} - ${item.nome_produto}`;

        const tamanho = document.createElement('p');
        tamanho.textContent = `Tamanho: ${item.tamanho}`;

        const quantidade = document.createElement('p');
        quantidade.textContent = `Quantidade: ${item.quantidade}`;

        const preco = document.createElement('p');

        preco.textContent =
            `Preço unitário: ${formatarPreco(item.preco_unitario)}`;

        const subtotal = document.createElement('p');

        subtotal.textContent =
            `Subtotal: ${formatarPreco(item.subtotal_item)}`;

        div.append(
            titulo,
            tamanho,
            quantidade,
            preco,
            subtotal
        );

        if (podeEditarItens()) {

            const botao = document.createElement('button');

            botao.type = 'button';
            botao.textContent = 'Remover';

            botao.onclick = () => removerItem(indice);

            div.appendChild(botao);
        }

        saida.appendChild(div);
    });
}

// Calcular subtotal estimado
function calcularSubtotal() {

    const subtotal = itens.reduce(
        (total, item) =>
            total + Number(item.preco_unitario) *
            Number(item.quantidade),
        0
    );

    document.getElementById('inputSubtotal').value =
        formatarPreco(subtotal);

    document.getElementById('inputEntrega').value =
        'Calculado ao salvar';

    document.getElementById('inputTotal').value =
        'Calculado ao salvar';
}

// Salvar pedido
async function salvar() {

    if (salvando || adicionando) return;

    if (
        oQueEstaFazendo !== 'inserindo' &&
        oQueEstaFazendo !== 'alterando'
    ) return;

    const id_pedido = Number(
        document.getElementById('inputId_pedido').value
    );

    const cliente_cpf = document
        .getElementById('inputCliente').value.trim();

    const forma_pagamento = document
        .getElementById('inputPagamento').value;

    const status_pedido = document
        .getElementById('inputStatus').value;

    const somenteStatus =
        oQueEstaFazendo === 'alterando' &&
        (
            pedido.status_pedido === 'Enviado' ||
            status_pedido === 'Cancelado'
        );

    if (!somenteStatus) {

        if (!/^\d{11}$/.test(cliente_cpf)) {
            mostrarAviso('Informe o CPF do cliente com 11 números.');
            return;
        }

        if (!forma_pagamento) {
            mostrarAviso('Selecione a forma de pagamento.');
            return;
        }

        if (itens.length === 0) {
            mostrarAviso('Adicione pelo menos um produto.');
            return;
        }
    }

    if (!status_pedido) {
        mostrarAviso('Selecione o status.');
        return;
    }

    if (status_pedido === 'Cancelado') {

        const confirmar = confirm(
            'Deseja cancelar este pedido e devolver os produtos ao estoque?'
        );

        if (!confirmar) return;
    }

    const dadosPedido = {
        id_pedido,
        cliente_cpf,
        forma_pagamento,
        status_pedido,

        itens: itens.map(item => ({
            id_produto: item.produto_id,
            tamanho: item.tamanho,
            quantidade: item.quantidade
        }))
    };

    salvando = true;

    document.getElementById('btSalvar').disabled = true;
    document.getElementById('btCancelar').disabled = true;
    document.getElementById('btAdicionar').disabled = true;

    try {

        let resposta;

        if (oQueEstaFazendo === 'inserindo') {

            resposta = await fetch(`${URL_API}/pedido`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosPedido)
            });

        } else {

            resposta = await fetch(
                `${URL_API}/pedido/${id_pedido}`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dadosPedido)
                }
            );
        }

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem || 'Erro ao salvar pedido.'
            );
        }

        limparAtributos();

        document.getElementById('inputId_pedido').value = '';

        visibilidadeDosBotoes(
            'inline', 'none', 'none', 'none'
        );

        mostrarAviso(
            resultado.mensagem || 'Pedido salvo com sucesso!'
        );

        await listar();

    } catch (erro) {

        console.error(erro);
        mostrarAviso(erro.message);

    } finally {

        salvando = false;

        document.getElementById('btSalvar').disabled = false;
        document.getElementById('btCancelar').disabled = false;
        document.getElementById('btAdicionar').disabled = false;
    }
}

// Listar pedidos
async function listar() {

    const saida = document.getElementById('outputSaida');

    try {

        const resposta = await fetch(
            `${URL_API}/pedido/listar`,
            {
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || 'Erro ao listar pedidos.'
            );
        }

        saida.innerHTML = '';

        if (dados.pedidos.length === 0) {
            saida.textContent = 'Nenhum pedido cadastrado.';
            return;
        }

        for (const linha of dados.pedidos) {

            const div = document.createElement('div');
            div.className = 'pedido-listado';

            const titulo = document.createElement('strong');

            titulo.textContent =
                `${linha.id_pedido} - ${linha.nome_cliente || linha.cliente_cpf}`;

            const cliente = document.createElement('p');
            cliente.textContent = `CPF: ${linha.cliente_cpf}`;

            const data = document.createElement('p');
            data.textContent = `Data: ${formatarData(linha.data_pedido)}`;

            const status = document.createElement('p');
            status.textContent = `Status: ${linha.status_pedido}`;

            const pagamento = document.createElement('p');

            pagamento.textContent =
                `Pagamento: ${linha.forma_pagamento}`;

            const total = document.createElement('p');

            total.textContent =
                `Total: ${formatarPreco(linha.valor_total)}`;

            div.append(
                titulo,
                cliente,
                data,
                status,
                pagamento,
                total
            );

            saida.appendChild(div);
        }

    } catch (erro) {

        console.error(erro);
        saida.textContent = erro.message;
    }
}

// Cancelar operação
function cancelarOperacao() {

    if (salvando || adicionando) return;

    limparAtributos();

    document.getElementById('inputId_pedido').value = '';

    visibilidadeDosBotoes(
        'inline', 'none', 'none', 'none'
    );

    mostrarAviso('Cancelou a operação.');
}

// Mostrar aviso
function mostrarAviso(mensagem) {

    document.getElementById('divAviso').textContent =
        mensagem;
}

// Mostrar dados do pedido
function mostrarDadosPedido(p) {

    document.getElementById('inputId_pedido').value =
        p.id_pedido;

    document.getElementById('inputCliente').value =
        p.cliente_cpf;

    document.getElementById('inputData').value =
        formatarData(p.data_pedido);

    document.getElementById('inputPagamento').value =
        p.forma_pagamento;

    document.getElementById('inputStatus').value =
        p.status_pedido;

    document.getElementById('inputSubtotal').value =
        formatarPreco(p.subtotal);

    document.getElementById('inputEntrega').value =
        formatarPreco(p.valor_entrega);

    document.getElementById('inputTotal').value =
        formatarPreco(p.valor_total);

    itens = (p.itens || []).map(item => ({
        produto_id: Number(item.produto_id),
        nome_produto: item.nome_produto,
        tamanho: item.tamanho,
        quantidade: Number(item.quantidade),
        preco_unitario: Number(item.preco_unitario),
        subtotal_item: Number(item.subtotal_item)
    }));

    bloquearAtributos(true);

    mostrarItens();
}

// Limpar atributos
function limparAtributos() {

    pedido = null;
    itens = [];
    oQueEstaFazendo = '';

    document.getElementById('inputCliente').value = '';
    document.getElementById('inputData').value = '';
    document.getElementById('inputPagamento').value = '';
    document.getElementById('inputStatus').value = '';
    document.getElementById('inputSubtotal').value = '';
    document.getElementById('inputEntrega').value = '';
    document.getElementById('inputTotal').value = '';
    document.getElementById('inputProduto').value = '';
    document.getElementById('inputTamanho').value = '200g';
    document.getElementById('inputQuantidade').value = 1;

    const status = document.getElementById('inputStatus');

    for (const opcao of status.options) {
        opcao.disabled = false;
    }

    bloquearAtributos(true);

    mostrarItens();
}

// Bloquear atributos
function bloquearAtributos(soLeitura) {

    document.getElementById('inputId_pedido').readOnly =
        !soLeitura;

    document.getElementById('inputCliente').readOnly =
        soLeitura;

    document.getElementById('inputPagamento').disabled =
        soLeitura;

    document.getElementById('inputStatus').disabled =
        soLeitura;

    document.getElementById('formItens').style.display =
        soLeitura ? 'none' : 'block';
}

// Visibilidade dos botões
function visibilidadeDosBotoes(btP, btI, btA, btS) {

    document.getElementById('btProcure').style.display = btP;
    document.getElementById('btInserir').style.display = btI;
    document.getElementById('btAlterar').style.display = btA;
    document.getElementById('btSalvar').style.display = btS;
    document.getElementById('btCancelar').style.display = btS;
}
