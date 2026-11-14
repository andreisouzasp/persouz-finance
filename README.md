# 📊 Persouz Finance

<p align="center">
  <strong>Plataforma moderna de gestão e controle financeiro pessoal.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
</p>

---

## 📌 Sobre o Projeto

O **Persouz Finance** é uma aplicação Full Stack focada em simplificar o controle financeiro diário de forma inteligente, rápida e sem atritos. O projeto nasceu como um MVP front-end e agora está evoluindo para uma arquitetura cliente-servidor completa, com API REST tipada e integração assíncrona.

---

## 🚀 Funcionalidades Atuais

- 💳 **Gestão Completa de Transações (CRUD):** Criação, listagem, edição e exclusão de lançamentos consumindo uma API REST via `fetch` (`async/await`).
- 🏷️ **Categorização Dinâmica:** Opções de categorias filtradas automaticamente de acordo com o tipo da operação (Receita ou Despesa).
- 📈 **Cards de Resumo Financeiro:** Cálculo automático de Saldo Total, Total de Receitas e Total de Despesas.
- 🔍 **Filtros e Busca:** Filtragem por tipo de movimentação e pesquisa em tempo real por descrição.
- 📅 **Ordenação por Data:** Exibição das transações mais recentes agrupadas cronologicamente.
- 🌙 **Interface Dark Mode:** Layout responsivo e otimizado para navegação em desktop e dispositivos móveis.
- ♿ **Acessibilidade:** Estrutura HTML semântica com suporte a leitores de tela.

---

## 🛠️ Tecnologias Utilizadas

### **Front-end**
- **HTML5:** Estruturação semântica e formulários acessíveis.
- **CSS3:** Variáveis de CSS, Flexbox, Grid e suporte a temas.
- **JavaScript (ES6+):** Manipulação da DOM, eventos e requisições assíncronas (`Fetch API`).

### **Back-end**
- **Node.js & Express:** Criação do servidor HTTP, middlewares e roteamento REST.
- **TypeScript:** Tipagem estática, interfaces e validação de contratos de dados.

---

## ⚙️ Como Executar Localmente

### **1. Back-end (API)**
```bash
# Acesse a pasta do servidor
cd backend

# Instale as dependências
npm install

# Inicie o servidor em modo de desenvolvimento (porta 3000)
npm run dev
```

### **2. Front-end**
Abra a pasta `frontend/` utilizando uma extensão de servidor local (como o **Live Server** no VS Code) e acesse `index.html`.

---

## 🗺️ Roadmap (Próximos Passos)

- [x] **Back-end REST API:** Criação do servidor em **Node.js** com **TypeScript** e Express.
- [x] **Integração Front-end ↔ Back-end:** Migração do `localStorage` para chamadas assíncronas na API.
- [ ] **Banco de Dados:** Persistência definitiva com **PostgreSQL**.
- [ ] **Categorias Personalizadas:** Endpoints para gerenciamento dinâmico de categorias pelo usuário.
- [ ] **Autenticação:** Sistema seguro de Login e Cadastro (`login.html` e `register.html`).

---

## 📂 Estrutura de Arquivos

```text
persouz-finance/
├── backend/
│   ├── src/
│   │   ├── interfaces/
│   │   │   └── Transaction.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── assets/
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