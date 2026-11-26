
const URL_API = 'http://localhost:3001';

async function cadastrar() {
    const cpf_pessoa = document.getElementById('inputCPF_Pessoa').value.trim();
    const nome_pessoa = document.getElementById('inputNome_Pessoa').value.trim();
    const email_pessoa = document.getElementById('inputEmail_Pessoa').value.trim();
    const senha_pessoa = document.getElementById('inputSenha_Pessoa').value;
    const confirmarSenha = document.getElementById('inputConfirmarSenha').value;

    if (!cpf_pessoa || !nome_pessoa || !email_pessoa || !senha_pessoa || !confirmarSenha) {
        mostrarAviso('Preencha todos os campos.');
        return;
    }

    if (!/^\d{11}$/.test(cpf_pessoa)) {
        mostrarAviso('Informe um CPF com 11 números.');
        return;
    }

    if (senha_pessoa !== confirmarSenha) {
        mostrarAviso('As senhas não são iguais.');
        return;
    }

    try {
        const resposta = await fetch(`${URL_API}/cliente/cadastro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf_pessoa,
                nome_pessoa,
                email_pessoa,
                senha_pessoa
            })
        });

        const data = await resposta.json();

        if (!resposta.ok || !data.sucesso) {
            mostrarAviso(data.mensagem || 'Não foi possível realizar o cadastro.');
            return;
        }

        mostrarAviso('Conta criada com sucesso! Você já pode entrar.');

    } catch (erro) {
        console.error('Erro ao cadastrar:', erro);
        mostrarAviso('Erro ao conectar com o servidor.');
    }
}

function mostrarAviso(mensagem) {
    document.getElementById('divAviso').textContent = mensagem;
}
