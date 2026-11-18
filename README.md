# Digital Store Backend

API REST desenvolvida em Node.js, Express e MySQL como projeto acadêmico do curso de desenvolvimento Back-end da Digital College. A aplicação oferece gerenciamento de usuários, categorias e produtos, com autenticação via JWT, persistência com Sequelize, documentação interativa em Swagger e testes automatizados.

## Autoria

- **Desenvolvedor:** Erico Alves de Lima
- **Curso:** Digital College

## Tecnologias utilizadas

- **Node.js** — ambiente de execução JavaScript
- **Express** — framework para criação das rotas e middlewares HTTP
- **MySQL (`mysql2`)** — banco de dados relacional
- **Sequelize e Sequelize CLI** — ORM, modelos, associações e migrations
- **dotenv** — carregamento de variáveis de ambiente
- **bcrypt** — hash de senhas de usuários
- **jsonwebtoken (JWT)** — autenticação baseada em token Bearer
- **swagger-ui-express** — interface web para documentação OpenAPI 3.0
- **Nodemon** — reinicialização automática do servidor em desenvolvimento
- **Jest e Supertest** — testes automatizados da API e do banco de dados

## Funcionalidades principais

- **Verificação de status (`/health`):** rota pública para checar se a API está em execução.
- **Usuários e autenticação (`/v1/user`):** cadastro de usuários com senha criptografada, consulta por ID, login com geração de token JWT (`/v1/user/token`), atualização e exclusão protegidas por autenticação Bearer JWT.
- **Categorias (`/v1/category`):** listagem paginada com filtros (`/v1/category/search`), busca por ID e criação, edição e remoção protegidas por JWT.
- **Produtos (`/v1/product`):** busca paginada com filtros por termo, categorias, faixa de preço e opções (`/v1/product/search`), consulta por ID e gerenciamento protegido por JWT com suporte a categorias associadas, imagens (URL ou base64 servidas em `/media`) e opções de variação.

Os detalhes de parâmetros, formatos de requisição e respostas estão disponíveis na documentação Swagger da API.

## Como executar o projeto

### Pré-requisitos

- **Node.js** (v18 ou superior)
- **npm**
- **MySQL Server** em execução localmente (porta padrão `3306`)

### Instalação das dependências

Clone o repositório, acesse a pasta do projeto e instale as dependências:

```bash
git clone https://github.com/EricoAlves07/digital-store-backend.git
cd digital-store-backend
npm install
```

### Configuração do banco MySQL

Certifique-se de que o serviço do MySQL esteja ativo e que o usuário configurado tenha permissão para criar bancos de dados e tabelas. Os bancos definidos em `DB_NAME` e `DB_NAME_TEST` podem ser criados diretamente pelos scripts do projeto após configurar o arquivo `.env`.

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```bash
cp .env.example .env
```

> No Windows (Prompt de Comando), utilize `copy .env.example .env`.

Preencha as variáveis com os dados do seu ambiente local:

```env
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=digital_store
DB_NAME_TEST=digital_store_test
DB_USER=root
DB_PASS=sua_senha_do_mysql_aqui
DB_DIALECT=mysql

JWT_SECRET=substitua_por_uma_chave_secreta_forte
JWT_EXPIRES_IN=24h
```

### Execução das migrations

Crie o banco de dados de desenvolvimento e execute as migrations para gerar as tabelas (`users`, `categories`, `products`, `product_images`, `product_options` e `product_categories`):

```bash
npm run db:create
npm run db:migrate
```

Caso precise reverter a última migration ou todas elas:

```bash
npm run db:migrate:undo
npm run db:migrate:undo:all
```

### Inicialização do servidor

Para iniciar em modo de desenvolvimento (com Nodemon):

```bash
npm run dev
```

Para iniciar em modo padrão:

```bash
npm start
```

Por padrão, a API fica disponível em `http://localhost:3000` (ou na porta definida na variável `PORT`).

## Documentação da API

Com o servidor em execução, a documentação interativa do Swagger (OpenAPI 3.0.3) pode ser acessada em:

- **Swagger UI:** http://localhost:3000/api-docs
- **Especificação OpenAPI (JSON):** http://localhost:3000/api-docs.json

Para testar rotas protegidas diretamente pelo Swagger UI:

1. Cadastre um usuário em `POST /v1/user` e gere o token em `POST /v1/user/token`.
2. Clique em **Authorize** no topo da página `/api-docs` e informe o token retornado para enviá-lo no cabeçalho `Authorization: Bearer <token>`.

## Testes

Os testes automatizados utilizam **Jest** e **Supertest** e são executados no ambiente `test`, conectado ao banco definido em `DB_NAME_TEST` (`digital_store_test` por padrão).

Antes de rodar os testes pela primeira vez, crie e aplique as migrations no banco de testes:

```bash
npm run db:create -- --env test
npm run db:migrate -- --env test
```

Em seguida, execute a suíte de testes:

```bash
npm test
```
