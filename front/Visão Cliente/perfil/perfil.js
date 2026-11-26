
const URL_API = 'http://127.0.0.1:3001';

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();

    document.getElementById('formPerfil')
        .addEventListener('submit', salvarPerfil);

    document.getElementById('sairConta')
        .addEventListener('click', sairDaConta);
});

// CARREGAR PERFIL
async function carregarPerfil() {
    const tipoUsuario = sessionStorage.getItem('tipoUsuario');

    if (!tipoUsuario) {
        window.location.href = '../../login/login.html';
        return;
    }

    try {
        const resposta = await fetch(`${URL_API}/login/verificar`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await resposta.json();

        if (!resposta.ok || !data.sucesso) {
            sessionStorage.removeItem('usuarioLumiere');
            sessionStorage.removeItem('tipoUsuario');
            window.location.href = '../../login/login.html';
            return;
        }

        const usuario = data.usuario;

        // Confere se a pessoa possui o acesso selecionado.
        if (!data.opcoes.includes(tipoUsuario)) {
            alert('Você não possui permissão para acessar esta visão.');
            sessionStorage.removeItem('tipoUsuario');
            window.location.href = '../../login/login.html';
            return;
        }

        sessionStorage.setItem(
            'usuarioLumiere',
            JSON.stringify(usuario)
        );

        document.getElementById('cpf').value = usuario.cpf_pessoa || '';
        document.getElementById('nome').value = usuario.nome_pessoa || '';
        document.getElementById('email').value = usuario.email_pessoa || '';

        const campoCargo = document.getElementById('campoCargo');
        const linkAdministrativo = document.getElementById('linkAdministrativo');
        const informacaoAcesso = document.getElementById('informacaoAcesso');
        const linkInicio = document.getElementById('linkInicio');

        if (tipoUsuario === 'funcionario') {
            campoCargo.style.display = 'flex';
            document.getElementById('cargo').value =
                usuario.nome_cargo || 'Cargo não informado';

            linkAdministrativo.style.display = 'inline';
            linkInicio.style.display = 'none';

            informacaoAcesso.textContent = 'Perfil administrativo';
        } else {
            campoCargo.style.display = 'none';
            linkAdministrativo.style.display = 'none';
            linkInicio.style.display = 'inline';

            informacaoAcesso.textContent = 'Perfil de cliente';
        }

    } catch (erro) {
        console.error('Erro ao carregar perfil:', erro);
        mostrarMensagem('Não foi possível carregar seus dados.', 'erro');
    }
}

// SALVAR ALTERAÇÕES
async function salvarPerfil(event) {
    event.preventDefault();

    const nome_pessoa = document.getElementById('nome').value.trim();
    const email_pessoa = document.getElementById('email').value.trim();

    if (!nome_pessoa || !email_pessoa) {
        mostrarMensagem('Preencha todos os campos.', 'erro');
        return;
    }

    try {
        const resposta = await fetch(`${URL_API}/login/perfil`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome_pessoa,
                email_pessoa
            })
        });

        const data = await resposta.json();

        if (!resposta.ok || !data.sucesso) {
            mostrarMensagem(
                data.mensagem || 'Não foi possível salvar as alterações.',
                'erro'
            );
            return;
        }

        // Atualiza os dados armazenados na sessão.
        const usuarioAtual = JSON.parse(
            sessionStorage.getItem('usuarioLumiere')
        ) || {};

        const usuarioAtualizado = {
            ...usuarioAtual,
            ...data.usuario
        };

        sessionStorage.setItem(
            'usuarioLumiere',
            JSON.stringify(usuarioAtualizado)
        );

        mostrarMensagem('Dados atualizados com sucesso!', 'sucesso');

    } catch (erro) {
        console.error('Erro ao salvar perfil:', erro);
        mostrarMensagem('Erro ao conectar com o servidor.', 'erro');
    }
}

// SAIR DA CONTA
async function sairDaConta() {
    const confirmar = confirm('Deseja realmente sair da sua conta?');

    if (!confirmar) return;

    try {
        const resposta = await fetch(`${URL_API}/login/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await resposta.json();

        if (!resposta.ok || !data.sucesso) {
            alert(data.mensagem || 'Não foi possível sair da conta.');
            return;
        }

        sessionStorage.removeItem('usuarioLumiere');
        sessionStorage.removeItem('tipoUsuario');

        // Não apaga o carrinho salvo no localStorage.
        window.location.href = '../../login/login.html';

    } catch (erro) {
        console.error('Erro ao sair da conta:', erro);
        alert('Erro ao conectar com o servidor.');
    }
}

// MOSTRAR MENSAGENS
function mostrarMensagem(mensagem, tipo) {
    const elemento = document.getElementById('mensagemPerfil');

    elemento.textContent = mensagem;
    elemento.style.color = tipo === 'sucesso' ? '#47764c' : '#b34747';
}
