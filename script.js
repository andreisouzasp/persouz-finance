/* =================================== 
    Variáveis
====================================== */

// Cards de saldo, receitas e despesas
const balanceCard = document.querySelector('#balance-card .card-value');
const incomeCard = document.querySelector('#income-card .card-value');
const expenseCard = document.querySelector('#expense-card .card-value');

// Formulário de adicionar transação
const transactionForm = document.querySelector('#transactions-form');

// Campos do formulário
const descriptionInput = document.querySelector('#description');
const dateInput = document.querySelector('#date');
const categorySelect = document.querySelector('#category');
const valueInput = document.querySelector('#value');
const typeSelect = document.querySelector('#type');

// Grupos de categorias
const incomeGroup = document.querySelector('#income-group');
const expenseGroup = document.querySelector('#expense-group');

// Tabela de transações
const transactionsTable = document.querySelector('#transactions-table');
const tableContainer = document.querySelector('#transactions-container');
const tableBody = document.querySelector('#transactions-table tbody');

// Cria uma mensagem para exibir caso não tenha transações na tabela
const tableMessage = document.createElement('div');
tableMessage.className = 'table-message';
tableMessage.textContent = 'Nenhuma transação adicionada ainda.';
tableMessage.style.display = 'none';
tableContainer.append(tableMessage);

// Armazena as transações salvas no LocalStorage
let transactions = JSON.parse(localStorage.getItem('persouz_transactions')) || [];

/* =================================== 
    Funções
====================================== */

// Formata uma data para o padrão brasileiro (DD/MM/YYYY)
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Formato um número para o padrão monetário real (ex: 1000 -> "R$ 1.000,00")
function formatCurrency(amount) {
    return amount.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Atualiza a tabela de transações
function updateTransactions() {
    // Limpa o conteúdo da tabela
    tableBody.innerHTML = '';

    // Cria um array com as transações ordenadas por data
    const orderedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Contabiliza o total de transações
    let totalTransactions = 0;

    // Cria a linha da tabela com as informações
    orderedTransactions.forEach((transaction) => {
        const row = document.createElement('tr');
        const isIncome = transaction.type === 'income';
        const typeClass = isIncome ? 'income' : 'expense';
        const sign = isIncome ? '+' : '-';

        const dateCell = document.createElement('td');
        const descriptionCell = document.createElement('td');
        const categoryCell = document.createElement('td');
        const valueCell = document.createElement('td');
        const actionCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        const trashIcon = document.createElement('i');

        dateCell.textContent = formatDate(transaction.date);
        descriptionCell.textContent = transaction.description;
        categoryCell.textContent = transaction.category;
        valueCell.textContent = `${sign} ${formatCurrency(transaction.value)}`;
        valueCell.className = typeClass;
        valueCell.style.fontWeight = 'bold';
        deleteButton.type = 'button';
        deleteButton.className = 'btn-delete';
        deleteButton.onclick = () => deleteTransaction(transaction.id);
        trashIcon.className = 'fa-solid fa-trash-can';
        deleteButton.append(trashIcon);
        actionCell.append(deleteButton);
        row.append(dateCell, descriptionCell, categoryCell, valueCell, actionCell);
        tableBody.appendChild(row);
        totalTransactions++;
    });

    // Exibe a mensagem caso não haja transações
    if (totalTransactions) {
        transactionsTable.style.display = 'table';
        tableMessage.style.display = 'none';
    } else {
        transactionsTable.style.display = 'none';
        tableMessage.style.display = 'block';
    }
}

// Atualiza os cards de saldo, receitas e despesas
function updateCards() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
        if(transaction.type == 'income') {
            totalIncome += transaction.value;
        } else if(transaction.type == 'expense') {
            totalExpense += transaction.value;
        }
    });

    balanceCard.textContent = formatCurrency(totalIncome - totalExpense);
    incomeCard.textContent = formatCurrency(totalIncome);
    expenseCard.textContent = formatCurrency(totalExpense);
}

// Alterna e exibição das categorias com base no tipo selecionado
function updateCategorySelect() {
    const isIncome = typeSelect.value == 'income';
    incomeGroup.hidden = !isIncome;
    expenseGroup.hidden = isIncome;
    categorySelect.value = '';
}
typeSelect.addEventListener('change', updateCategorySelect);

// Salva as transações no navegador
function saveLocalStorage() { 
    localStorage.setItem('persouz_transactions', JSON.stringify(transactions));
}

// Deleta a transação pelo ID após clicar no botão de apagar
function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveLocalStorage();
    updateTransactions();
    updateCards();
}

// Ativa a interatividade do menu mobile
function setupMobileMenu() {
    const btnMenu = document.querySelector('.btn-menu');
    const nav = document.querySelector('.nav');

    if (btnMenu && nav) {
        btnMenu.addEventListener('click', () => {
            nav.classList.toggle('active');

            const icon = btnMenu.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });
    }
}

/* =================================== 
    Eventos
====================================== */

// Adiciona uma nova transação quando o usuário clica no botão "Adicionar"
transactionForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const transaction = {
        id: Date.now(),
        description: descriptionInput.value,
        date: dateInput.value,
        category: categorySelect.value,
        value: parseFloat(valueInput.value),
        type: typeSelect.value,
    }

    transactions.unshift(transaction);
    transactionForm.reset();
    updateTransactions();
    updateCards();
    updateCategorySelect();
    saveLocalStorage();
});

// Fecha o menu mobile ao clicar fora do cabeçalho
document.addEventListener('click', (event) => {
    const header = document.querySelector('.header');
    const nav = document.querySelector('.nav');
    const btnMenuIcon = document.querySelector('.btn-menu i');

    if (header && nav && !header.contains(event.target)) {
        if (nav.classList.contains('active')) {
            nav.classList.remove('active');
            if (btnMenuIcon) {
                btnMenuIcon.classList.add('fa-bars');
                btnMenuIcon.classList.remove('fa-xmark');
            }
        }
    }
});

/* =================================== 
    Inicialização
====================================== */

// Executado quando a página abre pela primeira vez para carregar os dados
function init() {
    updateTransactions();
    updateCards();
    updateCategorySelect();
    setupMobileMenu();
}

// Executa a inicialização
init();