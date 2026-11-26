
# LUMIÈRE | Velas Aromáticas

## Sobre o projeto

O **Lumière** é um sistema web desenvolvido para a comercialização e o gerenciamento de uma loja de velas aromáticas.

O sistema possui duas áreas: a visão do cliente, destinada à navegação e realização de compras, e a visão administrativa, destinada ao gerenciamento da loja.

O projeto foi desenvolvido como atividade avaliativa do 4º bimestre da disciplina de **Desenvolvimento Web 1 (DW1)**.

## Funcionalidades

### Visão Cliente

- Cadastro e login de clientes;
- Visualização de produtos por categoria;
- Consulta de preços e disponibilidade;
- Seleção de tamanhos e quantidades;
- Adição de produtos ao carrinho;
- Alteração de quantidade e remoção de produtos;
- Cadastro de endereço de entrega;
- Cálculo do frete;
- Seleção da forma de pagamento;
- Finalização de pedidos;
- Consulta do histórico de pedidos;
- Cancelamento de pedidos;
- Acesso ao perfil do cliente.

### Visão Administrativa

- Gerenciamento de produtos;
- Gerenciamento de categorias;
- Gerenciamento de clientes;
- Gerenciamento de funcionários;
- Gerenciamento de pedidos;
- Controle de preços e estoque;
- Upload de imagens dos produtos;
- Atualização do status dos pedidos;
- Controle de acesso por login.

## Tecnologias utilizadas

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- Node.js
- Express
- PostgreSQL
- Dotenv
- CORS
- Cookie-parser
- Multer
- Sharp

### Versionamento

- Git
- GitHub

## Arquitetura do projeto

O sistema utiliza a arquitetura Cliente/Servidor e segue a organização baseada no padrão MVC (Model, View e Controller), separando a interface do usuário, as regras de negócio e o acesso ao banco de dados.

## Estrutura do projeto

- `back/` — Backend da aplicação.
- `back/controllers/` — Controladores e regras de negócio.
- `back/routes/` — Rotas da API.
- `back/banco/` — Arquivo SQL do banco de dados.
- `front/` — Frontend da aplicação.
- `front/menu/` — Página inicial da loja.
- `front/login/` — Área de autenticação.
- `front/Visão Cliente/` — Páginas destinadas aos clientes.
- `front/Visão ADM/` — Páginas administrativas.

## Como executar o projeto

### 1. Pré-requisitos

É necessário possuir instalado:

- Node.js
- PostgreSQL
- Visual Studio Code

### 2. Instalar as dependências

Abra o terminal na pasta principal do projeto e execute:

```bash
cd back
npm install
```

### 3. Configurar o banco de dados

Crie um banco de dados no PostgreSQL e execute o arquivo:

```text
back/banco/vela.sql
```

Esse arquivo contém a estrutura das tabelas e seus relacionamentos.

### 4. Configurar o arquivo .env

Crie um arquivo `.env` dentro da pasta `back` com as seguintes informações:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nome_do_banco
DB_USER=postgres
DB_PASSWORD=sua_senha
PORT=3001
COOKIE_SECRET=sua_chave_secreta
```

Substitua os valores pelas informações do seu ambiente.

O arquivo `.env` não deve ser publicado no GitHub.

### 5. Iniciar o servidor

No terminal, dentro da pasta `back`, execute:

```bash
node server.js
```

O servidor estará disponível em:

```text
http://127.0.0.1:3001
```

### 6. Acessar o sistema

Abra o arquivo:

```text
front/menu/menu.html
```

Execute a página utilizando a extensão Live Server do Visual Studio Code, preferencialmente com o endereço 127.0.0.1.

## Banco de dados

O banco de dados foi desenvolvido utilizando PostgreSQL, com relacionamentos entre as entidades responsáveis pelo funcionamento da loja.

O sistema armazena informações relacionadas a:

- Pessoas;
- Clientes;
- Funcionários;
- Cargos;
- Categorias;
- Produtos;
- Endereços;
- Pedidos;
- Itens dos pedidos.

## Regras de negócio

- Os produtos possuem diferentes tamanhos, preços e quantidades em estoque.
- O estoque é atualizado após a realização de um pedido.
- O valor do frete é calculado de acordo com o endereço de entrega.
- O cliente precisa estar autenticado para finalizar uma compra.
- Os pedidos possuem diferentes status de acompanhamento.
- O cancelamento de pedidos permitidos devolve os produtos ao estoque.
- As funcionalidades administrativas são destinadas aos funcionários.

## Objetivo do projeto

Aplicar os conhecimentos adquiridos durante a disciplina de Desenvolvimento Web 1, integrando frontend, backend e banco de dados para desenvolver um sistema web funcional.



## Diagrama do Banco de Dados

[Diagrama Entidade-Relacionamento da Lumière](front/Visão%20ADM/imagens/mermaid-diagram.png)


## Desenvolvedora

**Yasmin Oliveira da Silva**

- Disciplina: Desenvolvimento Web 1 (DW1)
- Turma: M32
- 4º Bimestre
- Ano: 2026
