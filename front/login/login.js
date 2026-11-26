
const URL_API = 'http://127.0.0.1:3001';

async function entrar() {
    const cpf_pessoa = document.getElementById('inputCPF_Pessoa').value.trim();
    const senha_pessoa = document.getElementById('inputSenha_Pessoa').value;

    if (!cpf_pessoa || !senha_pessoa) {
        mostrarAviso('Informe o CPF e a senha.');
        return;
    }

    if (!/^\d{11}$/.test(cpf_pessoa)) {
        mostrarAviso('Informe um CPF válido.');
        return;
    }

    try {
        const resposta = await fetch(`${URL_API}/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf_pessoa,
                senha_pessoa
            })
        });

        const data = await resposta.json();

        if (!resposta.ok || !data.sucesso) {
            mostrarAviso(data.mensagem || 'Não foi possível realizar o login.');
            return;
        }

        sessionStorage.setItem(
            'usuarioLumiere',
            JSON.stringify(data.usuario)
        );

        if (!data.usuario || !data.usuario.cpf_pessoa) {
            mostrarAviso('Não foi possível identificar o CPF do usuário.');
            sessionStorage.removeItem('usuarioLumiere');
            return;
        }

        // Se for somente cliente, entra diretamente na loja.
        if (
            data.opcoes.length === 1 &&
            data.opcoes.includes('cliente')
        ) {
            sessionStorage.setItem('tipoUsuario', 'cliente');
            window.location.href = '../menu/menu.html';
            return;
        }

        // Se for funcionário e cliente, apresenta as duas opções.
        if (
            data.opcoes.includes('cliente') &&
            data.opcoes.includes('funcionario')
        ) {
            mostrarOpcoesAcesso();
            return;
        }

        // Caso tenha apenas acesso de funcionário.
        if (data.opcoes.includes('funcionario')) {
            sessionStorage.setItem('tipoUsuario', 'funcionario');
            window.location.href = '../Visão ADM/produto/produtos.html';
            return;
        }

        mostrarAviso('Tipo de usuário não reconhecido.');

    } catch (erro) {
        console.error('Erro no login:', erro);
        mostrarAviso('Erro ao conectar com o servidor.');
    }
}

// Mostrar as opções de acesso
function mostrarOpcoesAcesso() {
    const divAviso = document.getElementById('divAviso');

    divAviso.innerHTML = '';

    const titulo = document.createElement('p');
    titulo.textContent = 'Como deseja acessar o Lumière?';

    const botaoCliente = document.createElement('button');
    botaoCliente.textContent = 'COMPRAR';
    botaoCliente.type = 'button';

    botaoCliente.onclick = () => {
        sessionStorage.setItem('tipoUsuario', 'cliente');
        window.location.href = '../menu/menu.html';
    };

    const botaoFuncionario = document.createElement('button');
    botaoFuncionario.textContent = 'GERENCIAR';
    botaoFuncionario.type = 'button';

    botaoFuncionario.onclick = () => {
        sessionStorage.setItem('tipoUsuario', 'funcionario');
        window.location.href = '../Visão ADM/produto/produtos.html';
    };

    divAviso.appendChild(titulo);
    divAviso.appendChild(botaoCliente);
    divAviso.appendChild(botaoFuncionario);
}

function mostrarAviso(mensagem) {
    document.getElementById('divAviso').textContent = mensagem;
}
