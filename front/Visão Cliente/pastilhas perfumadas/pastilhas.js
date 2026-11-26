const URL_API = 'http://127.0.0.1:3001';
const TIPO_PASTILHAS = 3;

let produtos = [];
let produtoSelecionado = null;

// IDENTIFICAR O CLIENTE
const usuario = JSON.parse(
    sessionStorage.getItem('usuarioLumiere')
);

// DEFINIR A CHAVE DO CARRINHO
const chaveCarrinho = usuario && usuario.cpf_pessoa
    ? `carrinhoLumiere_${usuario.cpf_pessoa}`
    : 'carrinhoLumiere_visitante';

let carrinho = JSON.parse(
    localStorage.getItem(chaveCarrinho)
) || [];

document.addEventListener('DOMContentLoaded', () => {
    listarProdutos();

        // ATUALIZAR LINK DA CONTA
    const linkConta = document.getElementById('linkConta');
    const textoConta = document.getElementById('textoConta');

    const usuarioConta = JSON.parse(
        sessionStorage.getItem('usuarioLumiere')
    );

    if (linkConta && textoConta) {
        if (usuarioConta && usuarioConta.cpf_pessoa) {
            linkConta.href = '../perfil/perfil.html';
            linkConta.setAttribute('aria-label', 'Meu perfil');
            textoConta.textContent = 'Meu perfil';
        } else {
            linkConta.href = '../../login/login.html';
            linkConta.setAttribute('aria-label', 'Login');
            textoConta.textContent = 'Login';
        }
    }

    const categoria = document.getElementById('categoria');

    if (categoria) {
        categoria.addEventListener('change', filtrarProdutos);
    }

    document.getElementById('fecharModal')
        .addEventListener('click', fecharModal);

    document.getElementById('modalProduto')
        .addEventListener('click', evento => {
            if (evento.target.id === 'modalProduto') {
                fecharModal();
            }
        });

    document.getElementById('adicionarCarrinho')
        .addEventListener('click', adicionarAoCarrinho);

    document.getElementById('tamanhoProduto')
        .addEventListener('change', () => {
            document.getElementById('quantidadeProduto').value = 1;
            atualizarDisponibilidade();
            calcularPreco();
        });

    document.getElementById('quantidadeProduto')
        .addEventListener('input', calcularPreco);

    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') {
            fecharModal();
        }
    });
});


// LISTAR PRODUTOS
async function listarProdutos() {
    const lista = document.getElementById('lista-produtos');
    lista.textContent = 'Carregando produtos...';

    try {
        const resposta = await fetch(`${URL_API}/produto/listar`);
        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || 'Erro ao carregar produtos.');
        }

        produtos = dados.produtos.filter(
            produto => Number(produto.id_tipo_produto) === TIPO_PASTILHAS
        );

        mostrarProdutos(produtos);

    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);
        lista.textContent = 'Não foi possível carregar os produtos.';
    }
}


// MOSTRAR PRODUTOS
function mostrarProdutos(listaProdutos) {
    const lista = document.getElementById('lista-produtos');
    lista.innerHTML = '';

    if (listaProdutos.length === 0) {
        lista.textContent = 'Nenhuma pastilha encontrada nesta categoria.';
        return;
    }

    listaProdutos.forEach(produto => {
        const card = document.createElement('article');
        card.classList.add('produto');
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Ver detalhes de ${produto.nome_produto}`);

        const imagem = document.createElement('img');
        imagem.src = `${URL_API}/imagens/${produto.id_produto}.png`;
        imagem.alt = produto.nome_produto;
        imagem.classList.add('imagem-produto');
        imagem.onerror = () => imagem.style.display = 'none';

        const nome = document.createElement('h3');
        nome.textContent = produto.nome_produto;

        const categoria = document.createElement('p');
        categoria.textContent = produto.nome_categoria || '';

        const unidade = document.createElement('p');
        unidade.textContent = 'A partir de 200g';

        const preco = document.createElement('p');
        preco.classList.add('preco-produto');
        preco.textContent = formatarPreco(produto.preco_200g);

        const estoque = document.createElement('p');

        if (Number(produto.estoque_200g) > 0) {
            estoque.textContent = 'Disponível';
            estoque.classList.add('disponivel');
        } else {
            estoque.textContent = 'Indisponível';
            estoque.classList.add('indisponivel');
        }

        card.append(imagem, nome, categoria, unidade, preco, estoque);

        card.addEventListener('click', () => abrirModal(produto));

        card.addEventListener('keydown', evento => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                abrirModal(produto);
            }
        });

        lista.appendChild(card);
    });
}


// ABRIR MODAL
function abrirModal(produto) {
    produtoSelecionado = produto;

    document.getElementById('imagemModal').src =
        `${URL_API}/imagens/${produto.id_produto}.png`;

    document.getElementById('imagemModal').alt = produto.nome_produto;

    document.getElementById('nomeModal').textContent =
        produto.nome_produto;

    document.getElementById('categoriaModal').textContent =
        produto.nome_categoria || '';

    document.getElementById('tamanhoProduto').value = '200';
    document.getElementById('quantidadeProduto').value = 1;

    document.getElementById('mensagemCarrinho').textContent = '';

    atualizarDisponibilidade();
    calcularPreco();

    const modal = document.getElementById('modalProduto');
    modal.hidden = false;
    modal.classList.add('ativo');

    document.body.style.overflow = 'hidden';

    document.getElementById('fecharModal').focus();
}


// OBTER PREÇO DO TAMANHO
function obterPreco(tamanho) {
    if (!produtoSelecionado) return 0;

    return Number(produtoSelecionado[`preco_${tamanho}g`]) || 0;
}


// OBTER ESTOQUE DO TAMANHO
function obterEstoque(tamanho) {
    if (!produtoSelecionado) return 0;

    return Number(produtoSelecionado[`estoque_${tamanho}g`]) || 0;
}


// ATUALIZAR DISPONIBILIDADE
function atualizarDisponibilidade() {
    if (!produtoSelecionado) return;

    const tamanho = Number(
        document.getElementById('tamanhoProduto').value
    );

    const estoque = obterEstoque(tamanho);

    const disponibilidade =
        document.getElementById('disponibilidadeModal');

    const botao = document.getElementById('adicionarCarrinho');

    if (estoque > 0) {
        disponibilidade.textContent =
            `${estoque} unidade(s) disponível(is)`;

        disponibilidade.className = 'disponivel';
        botao.disabled = false;

        document.getElementById('quantidadeProduto').max = estoque;

    } else {
        disponibilidade.textContent = 'Tamanho indisponível';
        disponibilidade.className = 'indisponivel';
        botao.disabled = true;

        document.getElementById('quantidadeProduto').max = 1;
    }
}


// CALCULAR PREÇO
function calcularPreco() {
    if (!produtoSelecionado) return;

    const tamanho = Number(
        document.getElementById('tamanhoProduto').value
    );

    const quantidade = Number(
        document.getElementById('quantidadeProduto').value
    );

    const precoUnitario = obterPreco(tamanho);

    const precoTotal = precoUnitario * (
        Number.isInteger(quantidade) && quantidade > 0 ? quantidade : 1
    );

    document.getElementById('precoModal').textContent =
        formatarPreco(precoTotal);
}


// FECHAR MODAL
function fecharModal() {
    const modal = document.getElementById('modalProduto');

    if (modal.hidden) return;

    modal.hidden = true;
    modal.classList.remove('ativo');

    document.body.style.overflow = '';

    produtoSelecionado = null;
}


// ADICIONAR AO CARRINHO
function adicionarAoCarrinho() {
    if (!produtoSelecionado) return;

    const tamanho = Number(
        document.getElementById('tamanhoProduto').value
    );

    const quantidade = Number(
        document.getElementById('quantidadeProduto').value
    );

    const estoque = obterEstoque(tamanho);
    const preco = obterPreco(tamanho);

    const mensagem = document.getElementById('mensagemCarrinho');

    if (!Number.isInteger(quantidade) || quantidade < 1) {
        mensagem.textContent = 'Informe uma quantidade válida.';
        return;
    }

    if (quantidade > estoque) {
        mensagem.textContent =
            `Temos apenas ${estoque} unidade(s) disponíveis.`;
        return;
    }

    const item = {
        id_produto: produtoSelecionado.id_produto,
        nome: produtoSelecionado.nome_produto,
        categoria: produtoSelecionado.nome_categoria,
        imagem: `${URL_API}/imagens/${produtoSelecionado.id_produto}.png`,
        tamanho: tamanho,
        preco: preco,
        quantidade: quantidade,
        subtotal: preco * quantidade
    };

    const existente = carrinho.find(produto =>
        Number(produto.id_produto) === Number(item.id_produto) &&
        Number(produto.tamanho) === item.tamanho
    );

    if (existente) {
        if (existente.quantidade + quantidade > estoque) {
            mensagem.textContent =
                'A quantidade total ultrapassa o estoque disponível.';
            return;
        }

        existente.quantidade += quantidade;
        existente.subtotal = existente.preco * existente.quantidade;

    } else {
        carrinho.push(item);
    }

   localStorage.setItem(
    chaveCarrinho,
    JSON.stringify(carrinho)
);

    mensagem.textContent = 'Produto adicionado ao carrinho!';

    document.dispatchEvent(new CustomEvent('carrinhoAtualizado', {
        detail: carrinho
    }));
}


// FILTRAR POR CATEGORIA
function filtrarProdutos() {
    const categoriaElemento = document.getElementById('categoria');

    if (!categoriaElemento) return;

    const categoriaSelecionada = categoriaElemento.value
        .trim()
        .toLowerCase();

    if (categoriaSelecionada === 'todas') {
        mostrarProdutos(produtos);
        return;
    }

    const produtosFiltrados = produtos.filter(produto =>
        String(produto.nome_categoria || '').trim().toLowerCase()
        === categoriaSelecionada
    );

    mostrarProdutos(produtosFiltrados);
}


// FORMATAR PREÇO
function formatarPreco(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}