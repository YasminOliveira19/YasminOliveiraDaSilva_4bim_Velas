
const URL_API = "http://127.0.0.1:3001";

document.addEventListener("DOMContentLoaded", carregarPedidos);

function formatarPreco(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "Valor indisponível";
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "Valor indisponível";
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(data) {
    return new Date(data).toLocaleString("pt-BR");
}

async function carregarPedidos() {
    const lista = document.getElementById("lista-pedidos");

    try {
        const resposta = await fetch(`${URL_API}/pedido/listar`, {
            credentials: "include"
        }); s = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || "Não foi possível carregar os pedidos."
            );
        }

        lista.innerHTML = "";

        if (!dados.pedidos || dados.pedidos.length === 0) {
            lista.innerHTML = `
                <div class="sem-pedidos">
                    <h3>Você ainda não possui pedidos.</h3>
                    <p>Quando realizar uma compra, ela aparecerá aqui.</p>
                </div>
            `;
            return;
        }

        dados.pedidos.forEach(pedido => {
            const card = document.createElement("article");
            card.className = "pedido";

            const cabecalho = document.createElement("div");
            cabecalho.className = "cabecalho-pedido";

            const identificacao = document.createElement("div");

            const numero = document.createElement("strong");
            numero.textContent = `Pedido #${pedido.id_pedido}`;

            const data = document.createElement("p");
            data.textContent = formatarData(pedido.data_pedido);

            identificacao.append(numero, data);

            const status = document.createElement("span");
            status.className = "status";
            status.textContent = pedido.status_pedido;

            cabecalho.append(identificacao, status);

            const itens = document.createElement("div");
            itens.className = "itens-pedido";

            (pedido.itens || []).forEach(item => {
                const produto = document.createElement("div");
                produto.className = "item-pedido";

                const nome = document.createElement("strong");
                nome.textContent = item.nome_produto;

                const detalhes = document.createElement("p");
                detalhes.textContent =
                    `Tamanho: ${item.tamanho} | Quantidade: ${item.quantidade}`;

                const preco = document.createElement("p");
                preco.textContent =
                    `Preço unitário: ${formatarPreco(item.preco_unitario)}`;

                const subtotal = document.createElement("p");
                subtotal.textContent =
                    `Subtotal: ${formatarPreco(item.subtotal_item)}`;

                produto.append(nome, detalhes, preco, subtotal);

                itens.appendChild(produto);
            });

            const resumo = document.createElement("div");
            resumo.className = "resumo-pedido";

            const pagamento = document.createElement("p");
            pagamento.textContent =
                `Pagamento: ${pedido.forma_pagamento}`;

            const subtotal = document.createElement("p");
            subtotal.textContent =
                `Subtotal: ${formatarPreco(pedido.subtotal)}`;

            const entrega = document.createElement("p");
            entrega.textContent =
                `Entrega: ${formatarPreco(pedido.valor_entrega)}`;

            const total = document.createElement("strong");
            total.textContent =
                `Total: ${formatarPreco(pedido.valor_total)}`;

            resumo.append(pagamento, subtotal, entrega, total);

            card.append(cabecalho, itens, resumo);

            if (["Pendente", "Processando"].includes(pedido.status_pedido)) {
                const botao = document.createElement("button");

                botao.className = "cancelar";
                botao.textContent = "Cancelar pedido";

                botao.addEventListener("click", () => {
                    cancelarPedido(pedido.id_pedido);
                });

                card.appendChild(botao);
            }

            lista.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar pedidos:", erro);
        lista.textContent = erro.message;
    }
}

async function cancelarPedido(id) {
    const confirmar = confirm(
        `Deseja realmente cancelar o pedido #${id}?`
    );

    if (!confirmar) return;

    try {
        const resposta = await fetch(
            `${URL_API}/pedido/${id}/cancelar`,
            {
                method: "PUT",
                credentials: "include"
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || "Não foi possível cancelar."
            );
        }

        alert(dados.mensagem);
        carregarPedidos();

    } catch (erro) {
        console.error("Erro ao cancelar pedido:", erro);
        alert(erro.message);
    }
}
