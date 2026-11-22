# 📊 Persouz Finance

<p align="center">
  <strong>Plataforma moderna de gestão e controle financeiro pessoal.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
</p>

---

## 📌 Sobre o Projeto

O **Persouz Finance** é uma aplicação Full Stack multiusuário focada em simplificar o controle financeiro diário de forma inteligente, segura e sem atritos. O projeto conta com arquitetura cliente-servidor completa, API REST tipada em TypeScript, autenticação via JWT com criptografia de senhas e persistência relacional em PostgreSQL.

---

## 🚀 Funcionalidades Atuais

- 🔐 **Autenticação e Isolamento por Usuário:** Cadastro e login seguros com senhas criptografadas (`bcrypt`), geração de tokens `JWT`, middleware de proteção de rotas na API e guarda de sessão no front-end.
- 💳 **Gestão Completa de Transações (CRUD):** Criação, listagem, edição e exclusão de lançamentos persistidos no PostgreSQL via API REST (`fetch` com `async/await`).
- 🏷️ **Categorias Personalizadas (CRUD):** Exibição de categorias padrão do sistema e gerenciamento completo de categorias personalizadas por usuário com seletor visual de ícones e cores.
- 📈 **Cards de Resumo Financeiro:** Cálculo automático de Saldo Atual, Total de Receitas e Total de Despesas.
- 🔍 **Filtros e Busca:** Filtragem por tipo de movimentação (*Todos*, *Receitas*, *Despesas*) e pesquisa em tempo real por descrição.
- 📅 **Ordenação por Data:** Exibição das transações mais recentes agrupadas cronologicamente.
- 🌙 **Interface Dark Mode:** Layout responsivo e otimizado para navegação em desktop e dispositivos móveis.
- ♿ **Acessibilidade:** Estrutura HTML semântica com atributos ARIA e suporte a leitores de tela.

---

## 🛠️ Tecnologias Utilizadas

### **Front-end**
- **HTML5:** Estruturação semântica, formulários acessíveis e atributos ARIA.
- **CSS3:** Variáveis de CSS, Flexbox, Grid e suporte a temas.
- **JavaScript (ES6+):** Manipulação dinâmica da DOM, modais interativos, controle de sessão e requisições autenticadas (`Fetch API`).

### **Back-end**
- **Node.js & Express:** Criação do servidor HTTP, middlewares de autenticação e roteamento REST.
- **TypeScript:** Tipagem estática, interfaces (`User`, `PublicUser`, `Transaction`, `Category`) e validação de contratos e payloads em runtime.
- **PostgreSQL (`pg`):** Banco de dados relacional com pool de conexões configurado e consultas SQL parametrizadas.
- **Bcrypt & JSON Web Token (JWT):** Hashing seguro de senhas e autenticação stateless baseada em tokens.

---

## ⚙️ Como Executar Localmente

### **1. Back-end (API e Banco de Dados)**
```bash
# Acesse a pasta do servidor
cd server

# Instale as dependências
npm install
```

Crie um arquivo `.env` na raiz da pasta `server/` com as credenciais do seu PostgreSQL e a chave secreta do JWT:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=persouz_finance
DB_PASSWORD=sua_senha
DB_PORT=5432
JWT_SECRET=sua_chave_secreta_jwt
```

Inicie o servidor em modo de desenvolvimento:
```bash
# Inicia o servidor na porta 3000
npm run dev
```

### **2. Front-end**
Abra a pasta `client/` utilizando uma extensão de servidor local (como o **Live Server** no VS Code) e acesse `login.html` ou `index.html`.

---

## 🗺️ Roadmap (Próximos Passos)

- [x] **Back-end REST API:** Criação do servidor em **Node.js** com **TypeScript** e Express.
- [x] **Integração Front-end ↔ Back-end:** Migração do `localStorage` para chamadas assíncronas na API.
- [x] **Banco de Dados:** Persistência definitiva com **PostgreSQL**.
- [x] **Categorias Personalizadas:** Endpoints e interface para gerenciamento dinâmico de categorias com ícones e cores.
- [x] **Autenticação:** Sistema seguro de Login e Cadastro (`login.html` e `register.html` com `bcrypt` e `JWT`).
- [ ] **Arquitetura em Camadas:** Refatoração do back-end em `routes`, `controllers`, `repositories` e `middlewares`.
- [ ] **Análise Mensal & Gráficos:** Filtros por período e visualização de despesas por categoria.

---

## 📂 Estrutura de Arquivos

```text
persouz-finance/
├── server/
│   ├── src/
│   │   ├── database/
│   │   │   └── db.ts
│   │   ├── interfaces/
│   │   │   ├── Category.ts
│   │   │   ├── Transaction.ts
│   │   │   └── User.ts
│   │   └── server.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── img/
│   │   ├── favicon.png
│   │   └── logo.png
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   ├── categories.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── transactions.html
├── .gitignore
└── README.md
```