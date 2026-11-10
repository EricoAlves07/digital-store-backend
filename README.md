# Digital Store — Back-end API

API REST completa para a **Digital Store**, desenvolvida como projeto acadêmico Back-end da **Digital College**, seguindo rigorosamente o [escopo oficial](https://github.com/digitalcollegebr/projeto-backend).

---

## 1. Descrição do Projeto

A **Digital Store API** provê o gerenciamento completo de **Usuários**, **Categorias** e **Produtos** (incluindo múltiplas imagens, opções de variação e associação N:N com categorias), autenticação via **JSON Web Token (JWT)**, senhas criptografadas com **bcrypt**, persistência relacional em **MySQL** utilizando **Sequelize ORM + Migrations**, testes automatizados com **Jest e Supertest** e documentação interativa **Swagger/OpenAPI 3.0**.

---

## 2. Tecnologias Utilizadas

- **Node.js** — Ambiente de execução JavaScript
- **Express.js** — Framework HTTP para construção da API REST
- **MySQL (`mysql2`)** — Banco de dados relacional
- **Sequelize ORM & Sequelize CLI** — Mapeamento objeto-relacional e controle de versão do banco via migrations
- **dotenv** — Gerenciamento de variáveis de ambiente
- **bcrypt** — Criptografia (hash) segura de senhas
- **jsonwebtoken (JWT)** — Autenticação stateless baseada em token Bearer
- **swagger-ui-express** — Documentação interativa OpenAPI 3.0 (`/api-docs`)
- **Nodemon** — Reload automático em ambiente de desenvolvimento
- **Jest & Supertest** — Testes automatizados de unidade e integração

---

## 3. Requisitos de Instalação

- **Node.js** v18+ (recomendado v20 ou superior)
- **npm** v9+
- **MySQL Server** 8.0+ ativo localmente (porta padrão `3306`)

---

## 4. Como Configurar e Executar o Projeto do Zero

### 4.1. Clonar o repositório
```bash
git clone https://github.com/EricoAlves07/digital-store-backend.git
cd digital-store-backend
```

### 4.2. Instalar as dependências
```bash
npm install
```

### 4.3. Configurar variáveis de ambiente (`.env`)
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com as credenciais do seu MySQL local e defina uma chave secreta para o JWT:
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

### 4.4. Configurar o MySQL e Executar as Migrations
Crie o banco de dados e execute todas as migrations:
```bash
npm run db:create
npm run db:migrate
```
Caso precise reverter a última migration ou todas:
```bash
npm run db:migrate:undo
npm run db:migrate:undo:all
```

### 4.5. Iniciar o Servidor
- **Modo Desenvolvimento (com Nodemon):**
  ```bash
  npm run dev
  ```
- **Modo Produção:**
  ```bash
  npm start
  ```
O servidor iniciará em `http://localhost:3000`.

### 4.6. Executar os Testes Automatizados
Crie/migre o banco de testes (caso ainda não tenha feito) e execute o Jest:
```bash
npm test
```

---

## 5. Como Acessar a Documentação Swagger

Com o servidor rodando (`npm run dev` ou `npm start`), acesse no navegador:

- **Swagger UI Interativo:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Especificação JSON OpenAPI:** [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

### Utilizando o Botão `Authorize` no Swagger:
1. Crie um usuário no endpoint `POST /v1/user`.
2. Gere um token no endpoint `POST /v1/user/token`.
3. Copie o valor de `token` retornado.
4. Clique no botão **Authorize** no topo direito do `/api-docs`, cole o token no campo `Value` e confirme. Todas as rotas protegidas enviarão automaticamente o cabeçalho `Authorization: Bearer <token>`.

---

## 6. Lista de Endpoints

### Health Check
| Método | Endpoint | Autenticação | Descrição | Resposta |
| :--- | :--- | :---: | :--- | :---: |
| `GET` | `/health` | Pública | Verifica status de saúde da API | `200 OK` |

### Usuários (`/v1/user`)
| Método | Endpoint | Autenticação | Descrição | Sucesso | Erros |
| :--- | :--- | :---: | :--- | :---: | :---: |
| `GET` | `/v1/user/:id` | Pública | Busca usuário pelo ID (sem expor senha) | `200 OK` | `404` |
| `POST` | `/v1/user` | Pública | Cadastra novo usuário | `201 Created` | `400` |
| `PUT` | `/v1/user/:id` | **Bearer JWT** | Atualiza `firstname`, `surname` e `email` | `204 No Content` | `400, 401, 403, 404` |
| `DELETE` | `/v1/user/:id` | **Bearer JWT** | Exclui o usuário | `204 No Content` | `401, 403, 404` |
| `POST` | `/v1/user/token` | Pública | Autentica usuário e retorna token JWT | `200 OK` | `400` |

### Categorias (`/v1/category`)
| Método | Endpoint | Autenticação | Descrição | Sucesso | Erros |
| :--- | :--- | :---: | :--- | :---: | :---: |
| `GET` | `/v1/category/search` | Pública | Lista categorias com paginação e filtros | `200 OK` | `400` |
| `GET` | `/v1/category/:id` | Pública | Busca categoria pelo ID | `200 OK` | `404` |
| `POST` | `/v1/category` | **Bearer JWT** | Cria nova categoria | `201 Created` | `400, 401` |
| `PUT` | `/v1/category/:id` | **Bearer JWT** | Atualiza categoria existente | `204 No Content` | `400, 401, 404` |
| `DELETE` | `/v1/category/:id` | **Bearer JWT** | Remove categoria existente | `204 No Content` | `401, 404` |

### Produtos (`/v1/product`)
| Método | Endpoint | Autenticação | Descrição | Sucesso | Erros |
| :--- | :--- | :---: | :--- | :---: | :---: |
| `GET` | `/v1/product/search` | Pública | Busca paginada com filtros (`match`, `category_ids`, `price-range`, `option[id]`, `fields`) | `200 OK` | `400` |
| `GET` | `/v1/product/:id` | Pública | Busca produto pelo ID com categorias, imagens e opções | `200 OK` | `404` |
| `POST` | `/v1/product` | **Bearer JWT** | Cria produto com categorias, imagens e opções | `201 Created` | `400, 401` |
| `PUT` | `/v1/product/:id` | **Bearer JWT** | Atualiza produto, categorias, imagens e opções | `204 No Content` | `400, 401, 404` |
| `DELETE` | `/v1/product/:id` | **Bearer JWT** | Remove produto e seus relacionamentos | `204 No Content` | `401, 404` |

---

## 7. Exemplos de Autenticação e Requisições

### 7.1. Cadastro de Usuário (`POST /v1/user`)
```json
{
  "firstname": "Eric",
  "surname": "Alves",
  "email": "eric@example.com",
  "password": "123@123",
  "confirmPassword": "123@123"
}
```

### 7.2. Geração de Token JWT (`POST /v1/user/token`)
**Request:**
```json
{
  "email": "eric@example.com",
  "password": "123@123"
}
```
**Response (`200 OK`):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
Nas rotas protegidas (`POST/PUT/DELETE` de categorias e produtos, e `PUT/DELETE` de usuários), envie o cabeçalho:
```http
Authorization: Bearer <token>
```

### 7.3. Criação de Categoria (`POST /v1/category`)
```json
{
  "name": "Shoes",
  "slug": "shoes",
  "use_in_menu": true
}
```

### 7.4. Criação de Produto (`POST /v1/product`)
```json
{
  "enabled": true,
  "name": "Tênis K-Swiss V8",
  "slug": "tenis-k-swiss-v8",
  "use_in_menu": true,
  "stock": 10,
  "description": "Tênis esportivo de alta durabilidade",
  "price": 200,
  "price_with_discount": 149.9,
  "category_ids": [1],
  "images": [
    {
      "type": "image/png",
      "content": "https://store.example.com/media/shoe-1.png"
    }
  ],
  "options": [
    {
      "title": "Tamanho",
      "shape": "square",
      "radius": "4px",
      "type": "text",
      "values": ["39", "40", "41", "42"]
    }
  ]
}
```

### 7.5. Busca Avançada de Produtos (`GET /v1/product/search`)
Exemplo de URL com filtros combinados:
```http
GET /v1/product/search?limit=12&page=1&match=Tenis&category_ids=1,2&price-range=100-250&option[1]=39,40&fields=name,images,price
```

---

## 8. Estrutura de Pastas

```text
digital-store-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuração Sequelize (dev, test, prod)
│   │   └── swagger.js           # Especificação OpenAPI 3.0.3
│   ├── controllers/
│   │   ├── UserController.js
│   │   ├── CategoryController.js
│   │   └── ProductController.js
│   ├── middleware/
│   │   ├── authMiddleware.js    # Validação de JWT Bearer
│   │   └── errorMiddleware.js   # Tratamento centralizado de erros
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── Product.js
│   │   ├── ProductImage.js
│   │   ├── ProductOption.js
│   │   └── ProductCategory.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── categoryRoutes.js
│   │   └── productRoutes.js
│   ├── services/
│   │   ├── UserService.js
│   │   ├── CategoryService.js
│   │   └── ProductService.js
│   ├── app.js                   # Configuração do Express, rotas e Swagger
│   └── server.js                # Inicialização HTTP
├── migrations/                  # Migrations reversíveis do Sequelize CLI
├── tests/                       # Suítes de testes Jest + Supertest
├── .env.example                 # Modelo de variáveis de ambiente (sem segredos)
├── .gitignore
├── .sequelizerc
├── package.json
└── README.md
```

---

## 9. Integrantes da Equipe

- **Erico Alves**
- Desenvolvido para o Projeto Acadêmico Back-end — **Digital College**.
