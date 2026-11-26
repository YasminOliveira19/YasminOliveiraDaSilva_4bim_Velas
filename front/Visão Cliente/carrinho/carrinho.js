const URL_API = "http://127.0.0.1:3001";

// IDENTIFICAR O CLIENTE LOGADO
const usuario = JSON.parse(
    sessionStorage.getItem("usuarioLumiere")
);

if (!usuario || !usuario.cpf_pessoa) {
    alert("Faça login para acessar seu carrinho.");
    window.location.href = "../login/login.html";
}

// CRIAR UMA CHAVE EXCLUSIVA PARA CADA CPF
const chaveCarrinho = `carrinhoLumiere_${usuario.cpf_pessoa}`;

// CARREGAR O CARRINHO DO CLIENTE
let carrinho = JSON.parse(
    localStorage.getItem(chaveCarrinho)
) || [];

let frete = 0;

document.addEventListener("DOMContentLoaded", function () {

    mostrarCarrinho();
    
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

    document.getElementById("finalizar-compra")
        .addEventListener("click", finalizarCompra);

    document.getElementById("cidade-entrega")
        .addEventListener("input", atualizarResumo);

    document.getElementById("estado-entrega")
        .addEventListener("change", atualizarResumo);
});


// CONVERTER VALORES EM NÚMEROS
function converterNumero(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
}


// FORMATAR PREÇO
function formatarPreco(valor) {
    return converterNumero(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


// SALVAR CARRINHO DO CLIENTE
function salvarCarrinho() {
    localStorage.setItem(
        chaveCarrinho,
        JSON.stringify(carrinho)
    );

    mostrarCarrinho();
}

// MOSTRAR CARRINHO
function mostrarCarrinho() {

    const lista = document.getElementById("itens-carrinho");
    lista.innerHTML = "";

    if (carrinho.length === 0) {

        lista.innerHTML =
            '<p class="carrinho-vazio">O seu carrinho está vazio.</p>';

        atualizarResumo();
        return;
    }

    carrinho.forEach(function (produto, indice) {

        const preco = converterNumero(produto.preco);
        const quantidade = Math.max(
            1,
            Math.floor(converterNumero(produto.quantidade))
        );

        produto.quantidade = quantidade;
        produto.subtotal = preco * quantidade;

        const item = document.createElement("article");
        item.classList.add("item-carrinho");

        const imagem = document.createElement("img");
        imagem.src = produto.imagem || "";
        imagem.alt = produto.nome || "Produto Lumière";

        imagem.onerror = function () {
            imagem.style.display = "none";
        };

        const informacoes = document.createElement("div");
        informacoes.classList.add("informacoes-produto");

        const nome = document.createElement("h4");
        nome.textContent = produto.nome || "Produto";

        const categoria = document.createElement("p");
        categoria.textContent = produto.categoria || "";

        const tamanho = document.createElement("p");
        tamanho.textContent = `Tamanho: ${produto.tamanho || 200} g`;

        const precoTexto = document.createElement("p");
        precoTexto.textContent = `Preço: ${formatarPreco(preco)}`;

        const subtotal = document.createElement("p");
        subtotal.textContent =
            `Subtotal: ${formatarPreco(produto.subtotal)}`;

        const controles = document.createElement("div");
        controles.classList.add("controles-quantidade");

        const diminuir = document.createElement("button");
        diminuir.type = "button";
        diminuir.textContent = "-";

        diminuir.addEventListener("click", function () {
            alterarQuantidade(indice, -1);
        });

        const quantidadeTexto = document.createElement("span");
        quantidadeTexto.textContent = quantidade;

        const aumentar = document.createElement("button");
        aumentar.type = "button";
        aumentar.textContent = "+";

        aumentar.addEventListener("click", function () {
            alterarQuantidade(indice, 1);
        });

        const remover = document.createElement("button");
        remover.type = "button";
        remover.textContent = "Remover";
        remover.classList.add("remover-produto");

        remover.addEventListener("click", function () {
            removerProduto(indice);
        });

        controles.append(diminuir, quantidadeTexto, aumentar);

        informacoes.append(
            nome,
            categoria,
            tamanho,
            precoTexto,
            subtotal,
            controles,
            remover
        );

        item.append(imagem, informacoes);
        lista.appendChild(item);

    });

    atualizarResumo();
}


// ALTERAR QUANTIDADE
function alterarQuantidade(indice, alteracao) {

    const produto = carrinho[indice];

    if (!produto) return;

    const novaQuantidade =
        converterNumero(produto.quantidade) + alteracao;

    if (novaQuantidade < 1) return;

    produto.quantidade = novaQuantidade;
    produto.subtotal =
        converterNumero(produto.preco) * novaQuantidade;

    salvarCarrinho();
}


// REMOVER PRODUTO
function removerProduto(indice) {

    carrinho.splice(indice, 1);

    salvarCarrinho();
}


// CALCULAR FRETE
function calcularFrete() {

    const cidade = document
        .getElementById("cidade-entrega")
        .value
        .trim();

    const estado = document
        .getElementById("estado-entrega")
        .value;

    if (!cidade || !estado) {
        frete = 0;
        return false;
    }

    const cidadeNormalizada = cidade
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    if (
        estado === "PR" &&
        cidadeNormalizada === "campo mourao"
    ) {
        frete = 8;
    } else if (estado === "PR") {
        frete = 15;
    } else {
        frete = 25;
    }

    return true;
}


// ATUALIZAR RESUMO
function atualizarResumo() {

    const subtotal = carrinho.reduce(function (total, produto) {

        const preco = converterNumero(produto.preco);
        const quantidade = converterNumero(produto.quantidade);

        return total + (preco * quantidade);

    }, 0);

    const enderecoPreenchido = calcularFrete();

    document.getElementById("subtotal").textContent =
        formatarPreco(subtotal);

    document.getElementById("entrega").textContent =
        enderecoPreenchido ? formatarPreco(frete) : "A calcular";

    const total = subtotal + frete;

    document.getElementById("total").textContent =
        formatarPreco(total);

    document.getElementById("finalizar-compra").disabled =
        carrinho.length === 0 || !enderecoPreenchido;
}


// FINALIZAR COMPRA


async function finalizarCompra() {

    if (carrinho.length === 0) {
        alert("Adicione produtos ao carrinho antes de finalizar.");
        return;
    }

    const rua = document.getElementById("rua-entrega").value.trim();
    const numero = document.getElementById("numero-entrega").value.trim();
    const complemento = document.getElementById("complemento-entrega").value.trim();
    const bairro = document.getElementById("bairro-entrega").value.trim();
    const cidade = document.getElementById("cidade-entrega").value.trim();
    const estado = document.getElementById("estado-entrega").value;

    if (!rua || !numero || !bairro || !cidade || !estado) {
        alert("Preencha todos os campos obrigatórios do endereço.");
        return;
    }

    try {

        const resposta = await fetch(`${URL_API}/endereco`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                estado
            })
        });

        const data = await resposta.json();

        if (!resposta.ok || !data.sucesso) {
            alert(data.mensagem || "Não foi possível salvar o endereço.");
            return;
        }

        alert(
            "Endereço salvo com sucesso!\n\n" +
            `${rua}, ${numero}\n` +
            `${bairro} - ${cidade}/${estado}\n\n` +
            "A próxima etapa será confirmar o pedido."
        );
        window.location.href = "../finalização/finalizar.html";

    } catch (erro) {
        console.error("Erro ao salvar endereço:", erro);
        alert("Erro ao conectar com o servidor.");
    }
}
