const URL_API = 'http://127.0.0.1:3001';

// Carregar funcionários ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
    listarFuncionarios();
    listarCargos();

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
});

// LISTAR FUNCIONÁRIOS
async function listarFuncionarios() {
    const tabela = document.getElementById('tabelaFuncionarios');

    try {
        const resposta = await fetch(`${URL_API}/funcionario/listar`, {
            credentials: 'include'
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            mostrarAviso(dados.mensagem || 'Não foi possível listar os funcionários.');
            return;
        }

        tabela.innerHTML = '';

        if (dados.funcionarios.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="4">Nenhum funcionário cadastrado.</td>
                </tr>
            `;
            return;
        }

        dados.funcionarios.forEach(funcionario => {
            tabela.innerHTML += `
                <tr>
                    <td>${funcionario.cpf_pessoa}</td>
                    <td>${funcionario.nome_pessoa}</td>
                    <td>${funcionario.email_pessoa}</td>
                    <td>${funcionario.nome_cargo}</td>
                </tr>
            `;
        });

    } catch (erro) {
        console.error('Erro ao listar funcionários:', erro);
        mostrarAviso('Erro ao conectar com o servidor.');
    }
}

// LISTAR CARGOS
async function listarCargos() {
    const select = document.getElementById('selectCargo');

    try {
        const resposta = await fetch(`${URL_API}/funcionario/cargos`, {
            credentials: 'include'
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            mostrarAviso(dados.mensagem || 'Não foi possível carregar os cargos.');
            return;
        }

        select.innerHTML = '<option value="">-- Selecione um Cargo --</option>';

        dados.cargos.forEach(cargo => {
            select.innerHTML += `
                <option value="${cargo.id_cargo}">
                    ${cargo.nome_cargo}
                </option>
            `;
        });

    } catch (erro) {
        console.error('Erro ao listar cargos:', erro);
        mostrarAviso('Erro ao carregar os cargos.');
    }
}

// BUSCAR CLIENTE PELO CPF
async function buscarCliente() {
    const cpf = document.getElementById('inputCPF').value.trim();
    const dadosCliente = document.getElementById('dadosCliente');

    if (!/^\d{11}$/.test(cpf)) {
        mostrarAviso('Informe um CPF com 11 números.');
        dadosCliente.innerHTML = '';
        return;
    }

    try {
        const resposta = await fetch(
            `${URL_API}/funcionario/cliente/${encodeURIComponent(cpf)}`,
            { credentials: 'include' }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            mostrarAviso(dados.mensagem || 'Cliente não encontrado.');
            dadosCliente.innerHTML = '';
            return;
        }

        dadosCliente.innerHTML = `
            <p><strong>Cliente encontrado:</strong></p>
            <p>Nome: ${dados.cliente.nome_pessoa}</p>
            <p>CPF: ${dados.cliente.cpf_pessoa}</p>
            <p>E-mail: ${dados.cliente.email_pessoa}</p>
        `;

        mostrarAviso('');

    } catch (erro) {
        console.error('Erro ao buscar cliente:', erro);
        mostrarAviso('Erro ao conectar com o servidor.');
        dadosCliente.innerHTML = '';
    }
}

// PROMOVER CLIENTE A FUNCIONÁRIO
async function promoverFuncionario() {
    const cpf = document.getElementById('inputCPF').value.trim();
    const cargo = document.getElementById('selectCargo').value;
    const dadosCliente = document.getElementById('dadosCliente');

    if (!/^\d{11}$/.test(cpf)) {
        mostrarAviso('Informe um CPF válido.');
        return;
    }

    if (!dadosCliente.textContent.includes('Cliente encontrado:')) {
        mostrarAviso('Busque e confirme um cliente antes de promovê-lo.');
        return;
    }

    if (!cargo) {
        mostrarAviso('Selecione um cargo.');
        return;
    }

    try {
        const resposta = await fetch(`${URL_API}/funcionario/promover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                cpf_pessoa: cpf,
                cargo_id_cargo: Number(cargo)
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            mostrarAviso(dados.mensagem || 'Não foi possível promover o cliente.');
            return;
        }

        mostrarAviso('Cliente promovido a funcionário com sucesso!');

        document.getElementById('inputCPF').value = '';
        document.getElementById('selectCargo').value = '';
        dadosCliente.innerHTML = '';

        listarFuncionarios();

    } catch (erro) {
        console.error('Erro ao promover funcionário:', erro);
        mostrarAviso('Erro ao conectar com o servidor.');
    }
}

// EXIBIR MENSAGENS
function mostrarAviso(mensagem) {
    document.getElementById('divAviso').textContent = mensagem;
}
