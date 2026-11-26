
const janelaDestaques = document.querySelector('.janela-destaques');
const listaDestaques = document.querySelector('.lista-destaques');

const botaoAnterior = document.querySelector('.anterior-destaque');
const botaoProximo = document.querySelector('.proxima-destaque');

let posicaoDestaques = 0;

function atualizarCarrosselDestaques() {

    const produtos = listaDestaques.querySelectorAll('.produto-destaque');

    if (produtos.length === 0) return;

    const larguraProduto = produtos[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(listaDestaques).gap) || 0;

    const passo = larguraProduto + gap;

    const larguraJanela = janelaDestaques.clientWidth;

    const produtosVisiveis = Math.floor(
        (larguraJanela + gap) / passo
    );

    const maximo = Math.max(0, produtos.length - produtosVisiveis);

    posicaoDestaques = Math.min(posicaoDestaques, maximo);

    listaDestaques.style.transform =
        `translateX(-${posicaoDestaques * passo}px)`;

    botaoAnterior.disabled = posicaoDestaques === 0;
    botaoProximo.disabled = posicaoDestaques >= maximo;
}

botaoProximo.addEventListener('click', () => {
    posicaoDestaques++;
    atualizarCarrosselDestaques();
});

botaoAnterior.addEventListener('click', () => {
    posicaoDestaques--;
    atualizarCarrosselDestaques();
});

window.addEventListener('resize', atualizarCarrosselDestaques);

window.addEventListener('load', atualizarCarrosselDestaques);




const slides = document.querySelectorAll('.slide');
const indicadores = document.querySelectorAll('.indicador');
const anterior = document.querySelector('.seta.anterior');
const proxima = document.querySelector('.seta.proxima');

let slideAtual = 0;
let temporizador;

function mostrarSlide(indice) {

    slides[slideAtual].classList.remove('ativo');
    indicadores[slideAtual].classList.remove('ativo');

    slideAtual = (indice + slides.length) % slides.length;

    slides[slideAtual].classList.add('ativo');
    indicadores[slideAtual].classList.add('ativo');
}

function proximoSlide() {
    mostrarSlide(slideAtual + 1);
}

function anteriorSlide() {
    mostrarSlide(slideAtual - 1);
}

function iniciarCarrossel() {
    clearInterval(temporizador);

    temporizador = setInterval(proximoSlide, 5000);
}

proxima.addEventListener('click', () => {
    proximoSlide();
    iniciarCarrossel();
});

anterior.addEventListener('click', () => {
    anteriorSlide();
    iniciarCarrossel();
});

indicadores.forEach((indicador, indice) => {
    indicador.addEventListener('click', () => {
        mostrarSlide(indice);
        iniciarCarrossel();
    });
});

iniciarCarrossel();
