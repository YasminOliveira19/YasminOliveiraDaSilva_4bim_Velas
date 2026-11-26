
const URL_API = 'http://localhost:3001';
const SILHUETA_URL = `${URL_API}/imagens/silhueta.png`;

let oQueEstaFazendo = '';
let produto = null;

bloquearAtributos(true);

async function inicializar() {

    // ATUALIZAR LINK DA CONTA
    const linkConta = document.getElementById('linkConta');
    const textoConta = document.getElementById('textoConta');
    const usuarioConta = JSON.parse(sessionStorage.getItem('usuarioLumiere'));

    if (linkConta && textoConta) {
        if (usuarioConta && usuarioConta.cpf_pessoa) {
            linkConta.href = '../../Visão Cliente/perfil/perfil.html';
            linkConta.setAttribute('aria-label', 'Meu perfil');
            textoConta.textContent = 'Meu perfil';
        } else {
            linkConta.href = '../../login/login.html';
            linkConta.setAttribute('aria-label', 'Login');
            textoConta.textContent = 'Login';
        }
    }

    await carregarTipoProduto();
    await carregarCategoria();
    await listar();
}

function carregarImagem(id) {
    const img = document.getElementById('imgCartaz');

    if (!id) {
        img.src = SILHUETA_URL;
        return;
    }

    img.src = `${URL_API}/imagens/${id}.png?t=${new Date().getTime()}`;
    img.onerror = () => { img.src = SILHUETA_URL; };
}

function acionarUpload() {
    if (oQueEstaFazendo !== 'inserindo' && oQueEstaFazendo !== 'alterando') {
        mostrarAviso("Clique em Inserir ou Alterar primeiro para poder escolher uma imagem.");
        return;
    }

    document.getElementById('inputImagem').click();
}

function previewImagem() {
    const inputFiles = document.getElementById('inputImagem').files;

    if (inputFiles.length > 0) {
        const url = URL.createObjectURL(inputFiles[0]);
        document.getElementById('imgCartaz').src = url;
        mostrarAviso("Imagem escolhida! Clique em Salvar para concluir.");
    }
}

async function uploadImagemParaServidor(id) {
    const inputFiles = document.getElementById('inputImagem').files;

    if (inputFiles.length === 0) return;

    const formData = new FormData();
    formData.append('imagem', inputFiles[0]);

    try {
        const resposta = await fetch(`${URL_API}/produto/upload/${id}`, {
            method: 'POST',
            body: formData
        });

        if (!resposta.ok) {
            throw new Error("Erro ao enviar imagem.");
        }
    } catch (erro) {
        console.error("Erro ao enviar imagem:", erro);
    }
}

async function procurePorChavePrimaria(chave) {
    try {
        const resposta = await fetch(`${URL_API}/produto/${chave}`);
        const data = await resposta.json();

        return data.sucesso ? data.produto : null;
    } catch (erro) {
        return null;
    }
}

async function procure() {
    const id_produto = document.getElementById("inputId_produto").value;

    if (isNaN(id_produto) || !Number.isInteger(Number(id_produto)) || id_produto === "") {
        mostrarAviso("Precisa ser um número inteiro");
        return;
    }

    produto = await procurePorChavePrimaria(id_produto);
    oQueEstaFazendo = '';

    if (produto) {
        mostrarDadosProduto(produto);
        carregarImagem(id_produto);

        visibilidadeDosBotoes('inline', 'none', 'inline', 'inline', 'none');
        mostrarAviso("Achou no banco, pode alterar ou excluir");
    } else {
        limparAtributos();
        carregarImagem(null);

        visibilidadeDosBotoes('inline', 'inline', 'none', 'none', 'none');
        mostrarAviso("Não achou no banco, pode inserir");
    }
}

function inserir() {
    bloquearAtributos(false);

    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');

    oQueEstaFazendo = 'inserindo';

    mostrarAviso("INSERINDO - Digite os atributos, escolha a imagem e clique em salvar");
}

function alterar() {
    bloquearAtributos(false);

    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');

    oQueEstaFazendo = 'alterando';

    mostrarAviso("ALTERANDO - Digite os atributos, mude a imagem (opcional) e clique em salvar");
}

function excluir() {
    bloquearAtributos(true);

    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');

    oQueEstaFazendo = 'excluindo';

    mostrarAviso("EXCLUINDO - Clique em Salvar para confirmar a exclusão");
}

async function salvar() {
    const id_produto = document.getElementById("inputId_produto").value;
    const nome_produto = document.getElementById("inputNome_produto").value;
    const id_tipo_produto = document.getElementById("inputTipo_produto").value;
    const id_categoria = document.getElementById("inputCategoria_produto").value;

    const preco_200g = Number(document.getElementById("inputPreco200").value.replace(',', '.'));
    const preco_400g = Number(document.getElementById("inputPreco400").value.replace(',', '.'));
    const preco_600g = Number(document.getElementById("inputPreco600").value.replace(',', '.'));

    const estoque_200g = Number(document.getElementById("inputEstoque200").value);
    const estoque_400g = Number(document.getElementById("inputEstoque400").value);
    const estoque_600g = Number(document.getElementById("inputEstoque600").value);

    if (oQueEstaFazendo === 'inserindo' || oQueEstaFazendo === 'alterando') {
        if (!nome_produto || !id_tipo_produto || !id_categoria) {
            mostrarAviso("Preencha o nome, o tipo e a categoria do produto.");
            return;
        }

        const precos = [preco_200g, preco_400g, preco_600g];
        const estoques = [estoque_200g, estoque_400g, estoque_600g];

        if (precos.some(p => !Number.isFinite(p) || p < 0)) {
            mostrarAviso("Informe preços válidos para os três tamanhos.");
            return;
        }

        if (estoques.some(e => !Number.isInteger(e) || e < 0)) {
            mostrarAviso("Informe estoques inteiros e válidos para os três tamanhos.");
            return;
        }
    }

    const dadosProduto = {
        nome_produto,
        id_tipo_produto,
        id_categoria,

        // Campos novos: cada tamanho tem seu próprio preço e estoque
        preco_200g,
        preco_400g,
        preco_600g,
        estoque_200g,
        estoque_400g,
        estoque_600g,

        // Campos antigos mantidos por compatibilidade com a tabela
        id_unidade_medida: 1,
        preco_produto: preco_200g,
        estoque: estoque_200g
    };

    try {
        if (oQueEstaFazendo === 'inserindo') {
            const resposta = await fetch(`${URL_API}/produto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosProduto)
            });

           const textoResposta = await resposta.text();
console.log("RESPOSTA DO BACKEND:", textoResposta);

let resultado;

try {
    resultado = JSON.parse(textoResposta);
} catch {
    throw new Error("O servidor não devolveu uma resposta JSON válida: " + textoResposta);
}

if (!resposta.ok || !resultado.sucesso) {
    throw new Error(
        resultado.erro ||
        resultado.detalhe ||
        resultado.mensagem ||
        "Erro ao inserir produto."
    );
}

            const novoId = resultado.produto?.id_produto || resultado.id_produto || id_produto;

            if (novoId) {
                await uploadImagemParaServidor(novoId);
            }

            mostrarAviso("Produto inserido com sucesso!");

        } else if (oQueEstaFazendo === 'alterando') {
            const resposta = await fetch(`${URL_API}/produto/${id_produto}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosProduto)
            });

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error(resultado.mensagem || "Erro ao alterar produto.");
            }

            await uploadImagemParaServidor(id_produto);
            mostrarAviso("Produto alterado com sucesso!");

        } else if (oQueEstaFazendo === 'excluindo') {
            const resposta = await fetch(`${URL_API}/produto/${id_produto}`, {
                method: 'DELETE'
            });

            if (!resposta.ok) {
                throw new Error("Erro ao excluir produto.");
            }

            carregarImagem(null);
            mostrarAviso("Produto excluído com sucesso!");
        }

        visibilidadeDosBotoes('inline', 'none', 'none', 'none', 'none');
        limparAtributos();
        document.getElementById("inputId_produto").value = "";

        await listar();

    } catch (erro) {
        console.error(erro);
        mostrarAviso(erro.message || "Erro ao efetuar operação no servidor.");
    }
}

async function listar() {
    try {
        const resposta = await fetch(`${URL_API}/produto/listar`);
        const data = await resposta.json();

        if (data.sucesso) {
            let texto = "";

            for (const linha of data.produtos) {
                const preco200 = Number(linha.preco_200g).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });

                const preco400 = Number(linha.preco_400g).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });

                const preco600 = Number(linha.preco_600g).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });

                texto += `
                    <strong>${linha.id_produto} - ${linha.nome_produto}</strong>
                    <br>
                    <strong>${linha.nome_categoria} - ${linha.id_tipo_produto}</strong>
                    <br>
                    200g: ${preco200} | Estoque: ${linha.estoque_200g}
                    <br>
                    400g: ${preco400} | Estoque: ${linha.estoque_400g}
                    <br>
                    600g: ${preco600} | Estoque: ${linha.estoque_600g}
                    <br><br>
                `;
            }

            document.getElementById("outputSaida").innerHTML =
                texto || "Nenhum produto cadastrado.";
        }

    } catch (erro) {
        console.error(erro);
        document.getElementById("outputSaida").innerHTML = "Servidor offline.";
    }
}

function cancelarOperacao() {
    limparAtributos();
    carregarImagem(null);
    bloquearAtributos(true);

    visibilidadeDosBotoes(
        'inline',
        'none',
        'none',
        'none',
        'none'
    );

    mostrarAviso("Cancelou a operação");
}

function mostrarAviso(mensagem) {
    document.getElementById("divAviso").innerHTML = mensagem;
}

function mostrarDadosProduto(p) {
    document.getElementById("inputId_produto").value = p.id_produto;
    document.getElementById("inputNome_produto").value = p.nome_produto;
    document.getElementById("inputTipo_produto").value = p.id_tipo_produto || "";
    document.getElementById("inputCategoria_produto").value = p.id_categoria || "";

    document.getElementById("inputPreco200").value = p.preco_200g ?? "";
    document.getElementById("inputEstoque200").value = p.estoque_200g ?? "";

    document.getElementById("inputPreco400").value = p.preco_400g ?? "";
    document.getElementById("inputEstoque400").value = p.estoque_400g ?? "";

    document.getElementById("inputPreco600").value = p.preco_600g ?? "";
    document.getElementById("inputEstoque600").value = p.estoque_600g ?? "";

    bloquearAtributos(true);
}

function limparAtributos() {
    produto = null;
    oQueEstaFazendo = '';

    document.getElementById("inputNome_produto").value = "";
    document.getElementById("inputTipo_produto").value = "";
    document.getElementById("inputCategoria_produto").value = "";

    document.getElementById("inputPreco200").value = "";
    document.getElementById("inputEstoque200").value = "";

    document.getElementById("inputPreco400").value = "";
    document.getElementById("inputEstoque400").value = "";

    document.getElementById("inputPreco600").value = "";
    document.getElementById("inputEstoque600").value = "";

    document.getElementById("inputImagem").value = "";

    bloquearAtributos(true);
}

function bloquearAtributos(soLeitura) {
    document.getElementById("inputId_produto").readOnly = !soLeitura;
    document.getElementById("inputNome_produto").readOnly = soLeitura;

    document.getElementById("inputTipo_produto").disabled = soLeitura;
    document.getElementById("inputCategoria_produto").disabled = soLeitura;

    document.getElementById("inputPreco200").readOnly = soLeitura;
    document.getElementById("inputEstoque200").readOnly = soLeitura;

    document.getElementById("inputPreco400").readOnly = soLeitura;
    document.getElementById("inputEstoque400").readOnly = soLeitura;

    document.getElementById("inputPreco600").readOnly = soLeitura;
    document.getElementById("inputEstoque600").readOnly = soLeitura;
}

function visibilidadeDosBotoes(btP, btI, btA, btE, btS) {
    document.getElementById("btProcure").style.display = btP;
    document.getElementById("btInserir").style.display = btI;
    document.getElementById("btAlterar").style.display = btA;
    document.getElementById("btExcluir").style.display = btE;
    document.getElementById("btSalvar").style.display = btS;
    document.getElementById("btCancelar").style.display = btS;
}

async function carregarTipoProduto() {
    const select = document.getElementById("inputTipo_produto");

    try {
        const resposta = await fetch(`${URL_API}/produto/tipos`);
        const data = await resposta.json();

        if (data.sucesso) {
            select.innerHTML = '<option value="">-- Selecione um Tipo --</option>';

            data.tipos.forEach(tipo => {
                select.innerHTML += `
                    <option value="${tipo.id_tipo_produto}">
                        ${tipo.nome_tipo_produto}
                    </option>
                `;
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar tipos de produto:", erro);
        select.innerHTML = '<option value="">Erro ao carregar tipos</option>';
    }
}

async function carregarCategoria() {
    const select = document.getElementById("inputCategoria_produto");

    try {
        const resposta = await fetch(`${URL_API}/categoria/listar`);
        const data = await resposta.json();

        if (data.sucesso) {
            select.innerHTML = '<option value="">-- Selecione uma Categoria --</option>';

            data.categorias.forEach(categoria => {
                select.innerHTML += `
                    <option value="${categoria.id_categoria}">
                        ${categoria.id_categoria} - ${categoria.nome_categoria}
                    </option>
                `;
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
        select.innerHTML = '<option value="">Erro ao carregar categorias</option>';
    }
}
