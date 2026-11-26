
document.addEventListener("DOMContentLoaded", function () {

    const URL_API = "http://127.0.0.1:3001";

    // ATUALIZAR LINK DE LOGIN OU PERFIL
    const linkConta = document.getElementById("linkConta");
    const textoConta = document.getElementById("textoConta");

    const usuario = JSON.parse(
        sessionStorage.getItem("usuarioLumiere")
    );

    if (linkConta && textoConta) {
        if (usuario && usuario.cpf_pessoa) {
            linkConta.href = "../Visão Cliente/perfil/perfil.html";
            linkConta.setAttribute("aria-label", "Meu perfil");
            textoConta.textContent = "Meu perfil";
        } else {
            linkConta.href = "../login/login.html";
            linkConta.setAttribute("aria-label", "Login");
            textoConta.textContent = "Login";
        }
    }

    // ELEMENTOS DO CARROSSEL DE PRODUTOS
    const listaDestaques = document.querySelector(".lista-destaques");

    // ELEMENTOS DO MODAL
    const modal = document.getElementById("modalProduto");
    const fecharModal = document.getElementById("fecharModal");

    const imagemModal = document.getElementById("imagemModal");
    const nomeModal = document.getElementById("nomeModal");
    const precoModal = document.getElementById("precoModal");

    const tamanhoProduto = document.getElementById("tamanhoProduto");
    const quantidadeProduto = document.getElementById("quantidadeProduto");

    const adicionarCarrinho = document.getElementById("adicionarCarrinho");

    // ELEMENTOS OPCIONAIS DO MODAL
    const categoriaModal = document.getElementById("categoriaModal");
    const disponibilidadeModal = document.getElementById("disponibilidadeModal");
    const mensagemCarrinho = document.getElementById("mensagemCarrinho");

    let produtos = [];
    let produtoSelecionado = null;

    // FORMATAÇÃO DO PREÇO
    function formatarPreco(valor) {
        return Number(valor).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // IMAGEM DO PRODUTO
    function obterImagem(produto) {
        return `${URL_API}/imagens/${produto.id_produto}.png`;
    }

    // PREÇO CONFORME O TAMANHO
    function obterPreco(tamanho) {
        if (!produtoSelecionado) return 0;

        return Number(produtoSelecionado[`preco_${tamanho}g`]) || 0;
    }

    // ESTOQUE CONFORME O TAMANHO
    function obterEstoque(tamanho) {
        if (!produtoSelecionado) return 0;

        return Number(produtoSelecionado[`estoque_${tamanho}g`]) || 0;
    }

    // ATUALIZAR PREÇO E DISPONIBILIDADE DO MODAL
    function atualizarModal() {
        if (!produtoSelecionado) return;

        const tamanho = Number(tamanhoProduto.value);
        const quantidade = Number(quantidadeProduto.value) || 1;

        const preco = obterPreco(tamanho);
        const estoque = obterEstoque(tamanho);

        precoModal.textContent = formatarPreco(preco * quantidade);

        if (disponibilidadeModal) {
            disponibilidadeModal.textContent =
                estoque > 0
                    ? `${estoque} unidade(s) disponível(is)`
                    : "Produto indisponível neste tamanho.";
        }

        quantidadeProduto.max = estoque;

        if (estoque <= 0) {
            adicionarCarrinho.disabled = true;
        } else {
            adicionarCarrinho.disabled =
                !Number.isInteger(quantidade) ||
                quantidade < 1 ||
                quantidade > estoque;
        }

        if (mensagemCarrinho) {
            mensagemCarrinho.textContent = "";
        }
    }

    // ABRIR MODAL
    function abrirModal(produto) {
        produtoSelecionado = produto;

        nomeModal.textContent = produto.nome_produto;
        imagemModal.src = obterImagem(produto);
        imagemModal.alt = produto.nome_produto;

        if (categoriaModal) {
            categoriaModal.textContent = produto.nome_categoria || "";
        }

        tamanhoProduto.value = "200";
        quantidadeProduto.value = 1;

        atualizarModal();

        modal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    // FECHAR MODAL
    function fecharJanela() {
        modal.hidden = true;
        document.body.style.overflow = "";
        produtoSelecionado = null;
    }

    fecharModal.addEventListener("click", fecharJanela);

    modal.addEventListener("click", function (evento) {
        if (evento.target === modal) {
            fecharJanela();
        }
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && !modal.hidden) {
            fecharJanela();
        }
    });

    // ALTERAÇÃO DE TAMANHO E QUANTIDADE
    tamanhoProduto.addEventListener("change", function () {
        quantidadeProduto.value = 1;
        atualizarModal();
    });

    quantidadeProduto.addEventListener("input", atualizarModal);

    // CRIAR CARTÃO DO PRODUTO
    function criarCartao(produto) {
        const cartao = document.createElement("article");
        cartao.className = "produto-destaque";

        const imagem = document.createElement("img");
        imagem.className = "imagem-produto";
        imagem.src = obterImagem(produto);
        imagem.alt = produto.nome_produto;

        const nome = document.createElement("h3");
        nome.textContent = produto.nome_produto;

        const preco = document.createElement("p");
        preco.textContent = `A partir de ${formatarPreco(produto.preco_200g)} (200 g)`;

        const botao = document.createElement("button");
        botao.className = "botao-comprar";
        botao.textContent = "COMPRAR";
        botao.type = "button";

        botao.addEventListener("click", function () {
            abrirModal(produto);
        });

        cartao.appendChild(imagem);
        cartao.appendChild(nome);
        cartao.appendChild(preco);
        cartao.appendChild(botao);

        return cartao;
    }

    // CARREGAR PRODUTOS DO BANCO
    async function carregarProdutos() {
        try {
            const resposta = await fetch(`${URL_API}/produto/listar`);

            if (!resposta.ok) {
                throw new Error("Não foi possível carregar os produtos.");
            }

            const dados = await resposta.json();

            produtos = Array.isArray(dados)
                ? dados
                : dados.produtos || dados.dados || [];

            if (!Array.isArray(produtos)) {
                produtos = [];
            }

            listaDestaques.innerHTML = "";

            if (produtos.length === 0) {
                listaDestaques.textContent = "Nenhum produto disponível no momento.";
                return;
            }

            produtos.forEach(function (produto) {
                listaDestaques.appendChild(criarCartao(produto));
            });

            if (typeof atualizarCarrosselDestaques === "function") {
                atualizarCarrosselDestaques();
            }

        } catch (erro) {
            console.error("Erro ao carregar produtos:", erro);
            listaDestaques.textContent =
                "Não foi possível carregar os produtos. Tente novamente.";
        }
    }

    // ADICIONAR AO CARRINHO
    adicionarCarrinho.addEventListener("click", function () {
        if (!produtoSelecionado) return;

        const tamanho = Number(tamanhoProduto.value);
        const quantidade = Number(quantidadeProduto.value);

        const preco = obterPreco(tamanho);
        const estoque = obterEstoque(tamanho);

        if (!Number.isInteger(quantidade) || quantidade < 1) {
            alert("Informe uma quantidade válida.");
            return;
        }

        if (estoque <= 0 || quantidade > estoque) {
            alert("Quantidade indisponível em estoque.");
            return;
        }

        const item = {
            id_produto: produtoSelecionado.id_produto,
            nome: produtoSelecionado.nome_produto,
            categoria: produtoSelecionado.nome_categoria || "",
            imagem: obterImagem(produtoSelecionado),
            tamanho: tamanho,
            preco: preco,
            quantidade: quantidade,
            subtotal: preco * quantidade
        };

        const usuario = JSON.parse(
            sessionStorage.getItem("usuarioLumiere")
        );

        if (!usuario || !usuario.cpf_pessoa) {
            alert("Faça login para adicionar produtos ao carrinho.");
            window.location.href = "../login/login.html";
            return;
        }

        const chaveCarrinho = `carrinhoLumiere_${usuario.cpf_pessoa}`;

        let carrinho = JSON.parse(
            localStorage.getItem(chaveCarrinho)
        ) || [];

        const existente = carrinho.find(function (produto) {
            return produto.id_produto === item.id_produto &&
                produto.tamanho === item.tamanho;
        });

        if (existente) {
            if (existente.quantidade + quantidade > estoque) {
                alert("Não há estoque suficiente para essa quantidade.");
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

        window.dispatchEvent(new Event("carrinhoAtualizado"));

        if (mensagemCarrinho) {
            mensagemCarrinho.textContent = "Produto adicionado ao carrinho!";
        } else {
            alert("Produto adicionado ao carrinho!");
        }

        fecharJanela();
    });

    // INICIAR
    carregarProdutos();

});
