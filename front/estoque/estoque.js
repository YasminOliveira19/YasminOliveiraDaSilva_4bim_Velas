
// FUNÇÕES DE CONTROLO DE STOCK DA LUMIÈRE

const EstoqueLumiere = {

    // Consultar stock de um tamanho
    obterEstoque(produto, tamanho) {
        return Number(produto[`estoque_${tamanho}g`]) || 0;
    },

    // Verificar se todos os tamanhos estão indisponíveis
    produtoIndisponivel(produto) {
        return (
            this.obterEstoque(produto, 200) <= 0 &&
            this.obterEstoque(produto, 400) <= 0 &&
            this.obterEstoque(produto, 600) <= 0
        );
    },

    // Texto de disponibilidade
    obterDisponibilidade(produto, tamanho) {
        const estoque = this.obterEstoque(produto, tamanho);

        return estoque > 0
            ? `${estoque} unidade(s) disponível(is)`
            : "Indisponível";
    }
};
