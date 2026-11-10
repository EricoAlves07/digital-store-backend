const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Digital Store API — Digital College',
    version: '1.0.0',
    description:
      'Documentação oficial da API REST Back-end da Digital Store (Usuários, Categorias e Produtos com autenticação JWT).',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor Local de Desenvolvimento',
    },
  ],
  tags: [
    { name: 'Health', description: 'Verificação de status da API' },
    { name: 'Usuários', description: 'Gerenciamento de usuários e autenticação JWT' },
    { name: 'Categorias', description: 'Gerenciamento e busca de categorias' },
    { name: 'Produtos', description: 'Gerenciamento e busca avançada de produtos' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Informe o token JWT obtido em POST /v1/user/token',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Descrição do erro ocorrido.',
          },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          firstname: { type: 'string', example: 'Eric' },
          surname: { type: 'string', example: 'Alves' },
          email: { type: 'string', format: 'email', example: 'eric@example.com' },
        },
      },
      UserCreateInput: {
        type: 'object',
        required: ['firstname', 'surname', 'email', 'password', 'confirmPassword'],
        properties: {
          firstname: { type: 'string', example: 'Eric' },
          surname: { type: 'string', example: 'Alves' },
          email: { type: 'string', format: 'email', example: 'eric@example.com' },
          password: { type: 'string', example: '123@123' },
          confirmPassword: { type: 'string', example: '123@123' },
        },
      },
      UserUpdateInput: {
        type: 'object',
        required: ['firstname', 'surname', 'email'],
        properties: {
          firstname: { type: 'string', example: 'Eric Atualizado' },
          surname: { type: 'string', example: 'Alves Silva' },
          email: { type: 'string', format: 'email', example: 'eric.novo@example.com' },
        },
      },
      TokenInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'eric@example.com' },
          password: { type: 'string', example: '123@123' },
        },
      },
      TokenResponse: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      CategoryResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Shoes' },
          slug: { type: 'string', example: 'shoes' },
          use_in_menu: { type: 'boolean', example: true },
        },
      },
      CategoryInput: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string', example: 'Shoes' },
          slug: { type: 'string', example: 'shoes' },
          use_in_menu: { type: 'boolean', example: true },
        },
      },
      ProductImageResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          content: {
            type: 'string',
            example: 'https://store.example.com/media/shoe-1.jpg',
          },
        },
      },
      ProductOptionResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Tamanho' },
          shape: { type: 'string', enum: ['square', 'circle'], example: 'square' },
          radius: { type: 'integer', example: 4 },
          type: { type: 'string', enum: ['text', 'color'], example: 'text' },
          values: {
            type: 'array',
            items: { type: 'string' },
            example: ['39', '40', '41'],
          },
        },
      },
      ProductResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          enabled: { type: 'boolean', example: true },
          name: { type: 'string', example: 'Tênis K-Swiss V8' },
          slug: { type: 'string', example: 'tenis-k-swiss-v8' },
          use_in_menu: { type: 'boolean', example: true },
          stock: { type: 'integer', example: 10 },
          description: { type: 'string', example: 'Tênis esportivo de alta performance' },
          price: { type: 'number', example: 200.0 },
          price_with_discount: { type: 'number', example: 149.9 },
          category_ids: {
            type: 'array',
            items: { type: 'integer' },
            example: [1],
          },
          images: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductImageResponse' },
          },
          options: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductOptionResponse' },
          },
        },
      },
      ProductCreateInput: {
        type: 'object',
        required: ['name', 'slug', 'price', 'price_with_discount'],
        properties: {
          enabled: { type: 'boolean', example: true },
          name: { type: 'string', example: 'Tênis K-Swiss V8' },
          slug: { type: 'string', example: 'tenis-k-swiss-v8' },
          use_in_menu: { type: 'boolean', example: true },
          stock: { type: 'integer', example: 10 },
          description: { type: 'string', example: 'Tênis esportivo de alta performance' },
          price: { type: 'number', example: 200.0 },
          price_with_discount: { type: 'number', example: 149.9 },
          category_ids: {
            type: 'array',
            items: { type: 'integer' },
            example: [1],
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'image/png' },
                content: {
                  type: 'string',
                  example: 'https://store.example.com/media/shoe-1.jpg',
                },
              },
            },
          },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Tamanho' },
                shape: { type: 'string', enum: ['square', 'circle'], example: 'square' },
                radius: {
                  oneOf: [{ type: 'integer' }, { type: 'string' }],
                  example: '4px',
                },
                type: { type: 'string', enum: ['text', 'color'], example: 'text' },
                values: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['39', '40', '41'],
                },
              },
            },
          },
        },
      },
      ProductUpdateInput: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', example: true },
          name: { type: 'string', example: 'Tênis K-Swiss V8 Editado' },
          slug: { type: 'string', example: 'tenis-k-swiss-v8-editado' },
          use_in_menu: { type: 'boolean', example: true },
          stock: { type: 'integer', example: 20 },
          description: { type: 'string', example: 'Descrição atualizada' },
          price: { type: 'number', example: 210.0 },
          price_with_discount: { type: 'number', example: 159.9 },
          category_ids: {
            type: 'array',
            items: { type: 'integer' },
            example: [1],
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                deleted: { type: 'boolean', example: true },
                type: { type: 'string', example: 'image/png' },
                content: {
                  type: 'string',
                  example: 'https://store.example.com/media/shoe-new.jpg',
                },
              },
            },
          },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                deleted: { type: 'boolean', example: false },
                title: { type: 'string', example: 'Tamanho' },
                shape: { type: 'string', enum: ['square', 'circle'], example: 'square' },
                radius: {
                  oneOf: [{ type: 'integer' }, { type: 'string' }],
                  example: '8px',
                },
                type: { type: 'string', enum: ['text', 'color'], example: 'text' },
                values: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['39', '40', '41', '42'],
                },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica o status de funcionamento da API',
        responses: {
          200: {
            description: 'Servidor operacional',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/user/token': {
      post: {
        tags: ['Usuários'],
        summary: 'Autentica um usuário e gera um token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TokenInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Token JWT gerado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TokenResponse' },
              },
            },
          },
          400: {
            description: 'Credenciais inválidas ou campos ausentes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/v1/user': {
      post: {
        tags: ['Usuários'],
        summary: 'Cadastra um novo usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserCreateInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuário criado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          400: {
            description: 'Dados inválidos ou e-mail já cadastrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/v1/user/{id}': {
      get: {
        tags: ['Usuários'],
        summary: 'Obtém um usuário pelo ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID do usuário',
          },
        ],
        responses: {
          200: {
            description: 'Dados do usuário encontrados (sem senha)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          404: {
            description: 'Usuário não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Usuários'],
        summary: 'Atualiza os dados de um usuário (Requer JWT)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID do usuário',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdateInput' },
            },
          },
        },
        responses: {
          204: { description: 'Usuário atualizado com sucesso (Sem conteúdo)' },
          400: {
            description: 'Dados inválidos ou e-mail duplicado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Token ausente ou inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Tentativa de alterar outro usuário',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Usuário não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Usuários'],
        summary: 'Exclui um usuário (Requer JWT)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID do usuário',
          },
        ],
        responses: {
          204: { description: 'Usuário excluído com sucesso (Sem conteúdo)' },
          401: { description: 'Token ausente ou inválido' },
          403: { description: 'Tentativa de excluir outro usuário' },
          404: { description: 'Usuário não encontrado' },
        },
      },
    },
    '/v1/category/search': {
      get: {
        tags: ['Categorias'],
        summary: 'Lista e filtra categorias com paginação',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 12 },
            description: 'Quantidade por página (-1 retorna todos)',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página',
          },
          {
            name: 'fields',
            in: 'query',
            schema: { type: 'string', example: 'name,slug' },
            description: 'Campos separados por vírgula',
          },
          {
            name: 'use_in_menu',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filtra categorias exibidas no menu',
          },
        ],
        responses: {
          200: {
            description: 'Lista paginada de categorias',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/CategoryResponse' },
                    },
                    total: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 12 },
                    page: { type: 'integer', example: 1 },
                  },
                },
              },
            },
          },
          400: { description: 'Parâmetros de consulta inválidos' },
        },
      },
    },
    '/v1/category': {
      post: {
        tags: ['Categorias'],
        summary: 'Cria uma nova categoria (Requer JWT)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CategoryInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Categoria criada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoryResponse' },
              },
            },
          },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autorizado (Token ausente ou inválido)' },
        },
      },
    },
    '/v1/category/{id}': {
      get: {
        tags: ['Categorias'],
        summary: 'Obtém uma categoria pelo ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Dados da categoria',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoryResponse' },
              },
            },
          },
          404: { description: 'Categoria não encontrada' },
        },
      },
      put: {
        tags: ['Categorias'],
        summary: 'Atualiza uma categoria pelo ID (Requer JWT)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CategoryInput' },
            },
          },
        },
        responses: {
          204: { description: 'Categoria atualizada com sucesso' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Token ausente ou inválido' },
          404: { description: 'Categoria não encontrada' },
        },
      },
      delete: {
        tags: ['Categorias'],
        summary: 'Exclui uma categoria pelo ID (Requer JWT)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          204: { description: 'Categoria excluída com sucesso' },
          401: { description: 'Token ausente ou inválido' },
          404: { description: 'Categoria não encontrada' },
        },
      },
    },
    '/v1/product/search': {
      get: {
        tags: ['Produtos'],
        summary: 'Busca produtos com paginação e filtros avançados',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 12 },
            description: 'Quantidade de itens por página (-1 retorna todos)',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página',
          },
          {
            name: 'fields',
            in: 'query',
            schema: { type: 'string', example: 'name,images,price' },
            description: 'Campos separados por vírgula',
          },
          {
            name: 'match',
            in: 'query',
            schema: { type: 'string', example: 'Tênis' },
            description: 'Termo para busca no nome ou descrição do produto',
          },
          {
            name: 'category_ids',
            in: 'query',
            schema: { type: 'string', example: '1,2' },
            description: 'IDs de categorias separados por vírgula',
          },
          {
            name: 'price-range',
            in: 'query',
            schema: { type: 'string', example: '100-250' },
            description: 'Intervalo de preço no formato min-max',
          },
          {
            name: 'option[1]',
            in: 'query',
            schema: { type: 'string', example: '39,40' },
            description: 'Filtro por valores de uma opção específica pelo ID da opção (ex.: option[45]=GG,PP)',
          },
        ],
        responses: {
          200: {
            description: 'Lista paginada de produtos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ProductResponse' },
                    },
                    total: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 12 },
                    page: { type: 'integer', example: 1 },
                  },
                },
              },
            },
          },
          400: { description: 'Parâmetros de busca inválidos' },
        },
      },
    },
    '/v1/product': {
      post: {
        tags: ['Produtos'],
        summary: 'Cadastra um novo produto com categorias, imagens e opções (Requer JWT)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductCreateInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Produto criado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductResponse' },
              },
            },
          },
          400: { description: 'Dados inválidos ou categorias inexistentes' },
          401: { description: 'Token ausente ou inválido' },
        },
      },
    },
    '/v1/product/{id}': {
      get: {
        tags: ['Produtos'],
        summary: 'Obtém um produto pelo ID com categorias, imagens e opções',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Dados completos do produto',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductResponse' },
              },
            },
          },
          404: { description: 'Produto não encontrado' },
        },
      },
      put: {
        tags: ['Produtos'],
        summary: 'Atualiza um produto, suas categorias, imagens e opções (Requer JWT)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductUpdateInput' },
            },
          },
        },
        responses: {
          204: { description: 'Produto atualizado com sucesso' },
          400: { description: 'Dados ou referências inválidas' },
          401: { description: 'Token ausente ou inválido' },
          404: { description: 'Produto não encontrado' },
        },
      },
      delete: {
        tags: ['Produtos'],
        summary: 'Exclui um produto e seus relacionamentos (Requer JWT)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          204: { description: 'Produto excluído com sucesso' },
          401: { description: 'Token ausente ou inválido' },
          404: { description: 'Produto não encontrado' },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
