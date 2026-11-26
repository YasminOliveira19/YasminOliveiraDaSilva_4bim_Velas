const URL_API = "http://127.0.0.1:3001";

const usuario = JSON.parse(
    sessionStorage.getItem("usuarioLumiere")
);

if (!usuario || !usuario.cpf_pessoa) {
    alert("Faça login para continuar.");
    window.location.href = "../../login/login.html";
}

const chaveCarrinho = `carrinhoLumiere_${usuario.cpf_pessoa}`;

let carrinho = JSON.parse(
    localStorage.getItem(chaveCarrinho)
) || [];

document.addEventListener("DOMContentLoaded", async function () {

    await carregarDadosCliente();
    await carregarEndereco();

    mostrarResumo();

    document.getElementById("cidade")
        .addEventListener("input", mostrarResumo);

    document.getElementById("estado")
        .addEventListener("change", mostrarResumo);

    document.getElementById("form-finalizar")
        .addEventListener("submit", confirmarPedido);
});

function converterNumero(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
}

function formatarPreco(valor) {
    return converterNumero(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Exibe os produtos e valores do pedido
function mostrarResumo() {
    const lista = document.getElementById("itens-pedido");

    lista.innerHTML = "";

    if (carrinho.length === 0) {
        lista.innerHTML = "<p>Seu carrinho está vazio.</p>";
        document.getElementById("confirmar-pedido").disabled = true;
        return;
    }

    let subtotal = 0;

    carrinho.forEach(function (produto) {
        const preco = converterNumero(produto.preco);
        const quantidade = converterNumero(produto.quantidade);
        const subtotalItem = preco * quantidade;

        subtotal += subtotalItem;

        const item = document.createElement("div");
        item.classList.add("item-pedido");

        const nome = document.createElement("p");
        nome.textContent = produto.nome;

        const tamanho = document.createElement("p");
        tamanho.textContent = `Tamanho: ${produto.tamanho}`;

        const quantidadeTexto = document.createElement("p");
        quantidadeTexto.textContent = `Quantidade: ${quantidade}`;

        const valor = document.createElement("p");
        valor.textContent = formatarPreco(subtotalItem);

        item.append(nome, tamanho, quantidadeTexto, valor);
        lista.appendChild(item);
    });

    document.getElementById("subtotal").textContent =
        formatarPreco(subtotal);

    // O frete será confirmado pelo backend usando o endereço salvo.
 const cidade = document.getElementById("cidade").value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const estado = document.getElementById("estado").value;

let frete = 0;

if (estado === "PR" && cidade === "campo mourao") {
    frete = 8;
} else if (estado === "PR") {
    frete = 15;
} else if (estado) {
    frete = 25;
}

document.getElementById("entrega").textContent =
    formatarPreco(frete);

document.getElementById("total").textContent =
    formatarPreco(subtotal + frete);
}


// Confirma o pedido
async function confirmarPedido(event) {
    event.preventDefault();

    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio.");
        return;
    }

    const botao = document.getElementById("confirmar-pedido");

   const formaPagamento = document.querySelector(
    'input[name="pagamento"]:checked'
);

    if (!formaPagamento) {
        alert("Selecione uma forma de pagamento.");
        return;
    }

    // Dados do endereço
const rua = document.getElementById("rua").value.trim();
const numero = document.getElementById("numero").value.trim();
const complemento = document.getElementById("complemento").value.trim();
const bairro = document.getElementById("bairro").value.trim();
const cidade = document.getElementById("cidade").value.trim();
const estado = document.getElementById("estado").value;

    if (!rua || !numero || !bairro || !cidade || !estado) {
        alert("Preencha todos os campos obrigatórios do endereço.");
        return;
    }

    botao.disabled = true;
    botao.textContent = "Processando...";

    try {
        // Primeiro, salva ou atualiza o endereço
        const respostaEndereco = await fetch(`${URL_API}/endereco`, {
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

        const dadosEndereco = await respostaEndereco.json();

        if (!respostaEndereco.ok || !dadosEndereco.sucesso) {
            throw new Error(
                dadosEndereco.mensagem || "Não foi possível salvar o endereço."
            );
        }

        // Envia os produtos e a forma de pagamento.
        // O backend consulta os preços e o estoque no banco.
        const respostaPedido = await fetch(`${URL_API}/pedido`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                forma_pagamento: formaPagamento.value,
                itens: carrinho.map(function (produto) {
                    return {
                        id_produto: produto.id_produto,
                        tamanho: produto.tamanho,
                        quantidade: produto.quantidade
                    };
                })
            })
        });

        const dadosPedido = await respostaPedido.json();

        if (!respostaPedido.ok || !dadosPedido.sucesso) {
            throw new Error(
                dadosPedido.mensagem || "Não foi possível registrar o pedido."
            );
        }

        // Só limpa o carrinho depois da confirmação do servidor
localStorage.removeItem(chaveCarrinho);

        alert(
            `Pedido realizado com sucesso!\n\n` +
            `Número do pedido: ${dadosPedido.id_pedido}\n` +
            `Subtotal: ${formatarPreco(dadosPedido.subtotal)}\n` +
            `Entrega: ${formatarPreco(dadosPedido.valor_entrega)}\n` +
            `Total: ${formatarPreco(dadosPedido.valor_total)}`
        );

window.location.href = "../pedido/pedido.html";

    } catch (erro) {
        console.error("Erro ao finalizar pedido:", erro);
        alert(erro.message || "Erro ao conectar com o servidor.");

        botao.disabled = false;
        botao.textContent = "Confirmar pedido";
    }
}

// Buscar dados do cliente conectado
async function carregarDadosCliente() {
    try {
        const resposta = await fetch(`${URL_API}/login/verificar`, {
            credentials: "include"
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            alert("Faça login para continuar.");
            window.location.href = "../../login/login.html";
            return;
        }

        document.getElementById("nome").value =
            dados.usuario.nome_pessoa || "";

        document.getElementById("email").value =
            dados.usuario.email_pessoa || "";

    } catch (erro) {
        console.error("Erro ao carregar dados do cliente:", erro);
        alert("Não foi possível carregar seus dados.");
    }
}


// Buscar endereço cadastrado
async function carregarEndereco() {
    try {
        const resposta = await fetch(`${URL_API}/endereco`, {
            credentials: "include"
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || "Erro ao buscar endereço.");
        }

        if (!dados.endereco) {
            alert("Nenhum endereço cadastrado. Volte ao carrinho.");
            return;
        }

        document.getElementById("rua").value =
            dados.endereco.rua || "";

        document.getElementById("numero").value =
            dados.endereco.numero || "";

        document.getElementById("complemento").value =
            dados.endereco.complemento || "";

        document.getElementById("bairro").value =
            dados.endereco.bairro || "";

        document.getElementById("cidade").value =
            dados.endereco.cidade || "";

        document.getElementById("estado").value =
            dados.endereco.estado || "";

    } catch (erro) {
        console.error("Erro ao carregar endereço:", erro);
        alert(erro.message);
    }
}