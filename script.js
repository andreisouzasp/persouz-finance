/* ==========================================================================
   PERSOUZ FINANCE - SUMÁRIO (TABLE OF CONTENTS)
   ==========================================================================
   1. Variáveis Globais e Seletores
   2. Renderização do DOM
   3. Operações de Adição, Edição e Exclusão
   4. Componentes Interativos
   5. Formatadores
   6. Inicialização
   ========================================================================== */

/* ==========================================================================
   1. Variáveis Globais e Seletores
   ========================================================================== */
const balanceCard = document.querySelector('#balance-card .card-value');
const incomeCard = document.querySelector('#income-card .card-value');
const expenseCard = document.querySelector('#expense-card .card-value');
const dashboardTransactions = document.querySelector('#dashboard-transactions ul');
const fullTransactions = document.querySelector('#full-transactions ul');
const modalOverlay = document.querySelector('#transaction-modal');
const modalTitle = document.querySelector('.modal-header h3');
const transactionForm = document.querySelector('#transaction-form');
const descriptionInput = document.querySelector('#desc');
const valueInput = document.querySelector('#amount');
const typeSelect = document.querySelector('#type');
const categorySelect = document.querySelector('#category');
const dateInput = document.querySelector('#date');
const allTypeButton = document.querySelector('#btn-type-all');
const incomeTypeButton = document.querySelector('#btn-type-income');
const expenseTypeButton = document.querySelector('#btn-type-expense');
const searchInput = document.querySelector('#search');

// Armazena as transações salvas no LocalStorage
let transactions = JSON.parse(localStorage.getItem('persouz_transactions')) || [];

// Lista de categorias disponíveis para classificação das transações
let categories = [
    // Despesas
    {name: 'Alimentação', type: 'expense', icon: 'fa-utensils'},
    {name: 'Assinaturas', type: 'expense', icon: 'fa-file-invoice-dollar'},
    {name: 'Casa', type: 'expense', icon: 'fa-house'},
    {name: 'Compras', type: 'expense', icon: 'fa-cart-shopping'},
    {name: 'Dívidas', type: 'expense', icon: 'fa-hand-holding-dollar'},
    {name: 'Educação', type: 'expense', icon: 'fa-book-open'},
    {name: 'Empresarial', type: 'expense', icon: 'fa-briefcase'},
    {name: 'Investimento', type: 'expense', icon: 'fa-chart-line'},
    {name: 'Lazer', type: 'expense', icon: 'fa-gamepad'},
    {name: 'Pessoal', type: 'expense', icon: 'fa-user'},
    {name: 'Pet', type: 'expense', icon: 'fa-paw'},
    {name: 'Saúde', type: 'expense', icon: 'fa-heart-pulse'},
    {name: 'Serviços', type: 'expense', icon: 'fa-screwdriver-wrench'},
    {name: 'Taxas', type: 'expense', icon: 'fa-percent'},
    {name: 'Transferências', type: 'expense', icon: 'fa-right-left'},
    {name: 'Transporte', type: 'expense', icon: 'fa-bus'},
    {name: 'Vestuário', type: 'expense', icon: 'fa-shirt'},
    {name: 'Viagem', type: 'expense', icon: 'fa-plane'},

    // Receitas
    {name: 'Cashback', type: 'income', icon: 'fa-money-bill-wave'},
    {name: 'Fatura', type: 'income', icon: 'fa-file-invoice-dollar'},
    {name: 'Presente', type: 'income', icon: 'fa-gift'},
    {name: 'Prêmio', type: 'income', icon: 'fa-trophy'},
    {name: 'Receitas variáveis', type: 'income', icon: 'fa-wallet'},
    {name: 'Renda extra', type: 'income', icon: 'fa-briefcase'},
    {name: 'Salário', type: 'income', icon: 'fa-sack-dollar'},
    {name: 'Transferências', type: 'income', icon: 'fa-right-left'},
    {name: 'Outros', type: 'income', icon: 'fa-ellipsis'}
];

// Armazena o ID da transação em edição
let editingTransactionId = null;

// Armazena a opção selecionada nos botões de Tipo
let selectedTypeButton = 'all';

// Armazena o texto na barra de pesquisa
let searchTextContent = '';

/* ==========================================================================
   2. Renderização do DOM
   ========================================================================== */
function updateTransactions(type = 'all', search = '') {
    const targetContainer = fullTransactions || dashboardTransactions;
    if(!targetContainer) return;

    targetContainer.innerHTML = '';

    // Ordena todas as transações por data
    let filtered = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Aplica o filtro de Tipo
    if(type !== 'all') {
        filtered = filtered.filter(transaction => transaction.type === type);
    }

    // Aplica o filtro de Busca por Descrição
    if(search.trim() !== '') {
        filtered = filtered.filter(transaction => 
            transaction.description.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Na página principal (Visão Geral), limita às 10 últimas
    if(dashboardTransactions) {
        filtered = filtered.slice(0, 10);
    }

    // Se a lista filtrada for vazia (ou sem dados originais), mostra o Estado Vazio
    if(filtered.length === 0) {
        targetContainer.innerHTML = `
            <li class="empty-list-item">
                <i class="fa-solid fa-receipt"></i>
                <p>Nenhuma transação encontrada</p>
            </li>
        `;
        return;
    }

    // Renderiza apenas as transações válidas
    filtered.forEach(transaction => {
        const row = document.createElement('li');
        const isIncome = transaction.type === 'income';
        const typeClass = isIncome ? 'income' : 'expense';
        const sign = isIncome ? '+' : '-';

        // Data
        const dateIcon = document.createElement('i');
        const dateCell = document.createElement('div');
        dateIcon.className = 'fa-solid fa-calendar';
        dateCell.className = 'transaction-date';
        dateCell.append(dateIcon, document.createTextNode(` ${formatDate(transaction.date)}`));

        // Categoria
        const categoryIcon = document.createElement('i');
        const categoryCell = document.createElement('div');
        const matchedCategory = categories.find(cat => cat.name === transaction.category);
        const iconClass = matchedCategory ? matchedCategory.icon : 'fa-tag';
        categoryIcon.className = `fa-solid ${iconClass}`;
        categoryCell.className = 'transaction-category';
        categoryCell.append(categoryIcon, document.createTextNode(` ${transaction.category}`));

        // Badge Tipo
        const typeIcon = document.createElement('i');
        const typeCell = document.createElement('div');
        typeIcon.className = `fa-solid fa-arrow-${isIncome ? 'up' : 'down'}`;
        typeCell.className = `badge badge-${typeClass}`;        
        typeCell.append(typeIcon, document.createTextNode(` ${isIncome ? 'Receita' : 'Despesa'}`));

        // Descrição
        const descriptionCell = document.createElement('div');
        descriptionCell.className = 'transaction-description';
        descriptionCell.textContent = transaction.description;

        // Valor
        const valueCell = document.createElement('div');
        valueCell.className = `transaction-value txt-${typeClass}`;
        valueCell.textContent = `${sign} ${formatCurrency(transaction.value)}`;

        row.append(dateCell, categoryCell, typeCell, descriptionCell, valueCell);

        // Ações de editar e excluir na página de transações
        if(fullTransactions) {
            row.className = 'transaction-item with-actions';

            // Botão Editar
            const editIcon = document.createElement('i');
            const editButton = document.createElement('button');
            editIcon.className = 'fa-solid fa-pen-to-square';
            editButton.type = 'button';
            editButton.className = 'btn-icon btn-edit';
            editButton.title = 'Editar';
            editButton.append(editIcon);
            editButton.onclick = () => openEditModal(transaction);

            // Botão Excluir
            const deleteIcon = document.createElement('i');
            const deleteButton = document.createElement('button');
            deleteIcon.className = 'fa-solid fa-trash-can';
            deleteButton.type = 'button';
            deleteButton.className = 'btn-icon btn-delete';
            deleteButton.title = 'Excluir';
            deleteButton.append(deleteIcon);
            deleteButton.onclick = () => deleteTransaction(transaction.id);

            const actionsCell = document.createElement('div');
            actionsCell.className = 'transaction-actions';
            actionsCell.append(editButton, deleteButton);

            row.append(actionsCell);
        } else {
            row.className = 'transaction-item';
        }

        targetContainer.append(row);
    });
}

function updateCards() {
    if(!balanceCard || !incomeCard || !expenseCard) return;

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
        if(transaction.type === 'income') totalIncome += transaction.value;
        if(transaction.type === 'expense') totalExpense += transaction.value;
    });

    balanceCard.textContent = formatCurrency(totalIncome - totalExpense);
    incomeCard.textContent = `+ ${formatCurrency(totalIncome)}`;
    expenseCard.textContent = `- ${formatCurrency(totalExpense)}`;
}

// Popula as opções do select com suporte a pré-seleção
function updateCategories(selectedCategory = null) {
    if(!categorySelect || !typeSelect) return;
    
    categorySelect.innerHTML = '';

    const firstOption = document.createElement('option');
    firstOption.value = '';
    firstOption.disabled = true;
    firstOption.selected = !selectedCategory;
    firstOption.textContent = 'Selecione uma categoria...';

    categorySelect.append(firstOption);

    categories.forEach(category => {
        if(category.type === typeSelect.value) {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;

            if(selectedCategory && category.name === selectedCategory) {
                option.selected = true;
            }

            categorySelect.append(option);
        }
    });
}

/* ==========================================================================
   3. Operações de Adição, Edição e Exclusão
   ========================================================================== */
if(transactionForm) {
    transactionForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const transactionData = {
            description: descriptionInput.value,
            date: dateInput.value,
            category: categorySelect.value,
            value: parseFloat(valueInput.value),
            type: typeSelect.value,
        };

        if(editingTransactionId !== null) {
            // Atualiza a transação existente no array
            transactions = transactions.map(transaction => {
                if(transaction.id === editingTransactionId) {
                    return { ...transaction, ...transactionData };
                }
                return transaction;
            });
        } else {
            // Cria uma nova transação com novo ID
            const newTransaction = {
                id: Date.now(),
                ...transactionData
            };
            transactions.unshift(newTransaction);
        }
        
        saveLocalStorage();
        updateTransactions();
        updateCards();
        closeModal();
    });

    typeSelect.addEventListener('change', () => {
        updateCategories();
    });
}

function openEditModal(transaction) {
    editingTransactionId = transaction.id;

    if(modalTitle) modalTitle.textContent = 'Editar Transação';

    // Preenche os campos com os dados existentes
    descriptionInput.value = transaction.description;
    valueInput.value = transaction.value;
    typeSelect.value = transaction.type;
    dateInput.value = transaction.date;

    // Popula e marca a categoria salva como selecionada
    updateCategories(transaction.category);

    if(modalOverlay) modalOverlay.classList.add('active');
}

function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveLocalStorage();
    updateTransactions();
    updateCards();
}

function saveLocalStorage() { 
    localStorage.setItem('persouz_transactions', JSON.stringify(transactions));
}

/* ==========================================================================
   4. Componentes Interativos
   ========================================================================== */
function initCompactMenu() {
    const btnMenu = document.querySelector('.btn-menu');
    const nav = document.querySelector('.nav');

    if(!btnMenu || !nav) return;

    const btnMenuIcon = btnMenu.querySelector('i');

    btnMenu.addEventListener('click', (event) => {
        event.stopPropagation();
        nav.classList.toggle('active');
        toggleMenuIcon(btnMenuIcon, nav.classList.contains('active'));
    });

    document.addEventListener('click', (event) => {
        if(!nav.contains(event.target) && !btnMenu.contains(event.target) && nav.classList.contains('active')) {
            nav.classList.remove('active');
            toggleMenuIcon(btnMenuIcon, false);
        }
    });
}

function toggleMenuIcon(iconElement, isActive) {
    if(!iconElement) return;
    iconElement.className = isActive ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
}

function initTransactionModal() {
    const openBtn = document.getElementById('open-modal-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    
    if(!modalOverlay) return;
    
    if(openBtn) {
        openBtn.addEventListener('click', () => {
            editingTransactionId = null;
            if(modalTitle) modalTitle.textContent = 'Adicionar Transação';
            if(transactionForm) transactionForm.reset();

            // Define a data de hoje como padrão (formato YYYY-MM-DD)
            if(dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }

            // Popula as categorias ao abrir o modal para criação
            updateCategories();
            modalOverlay.classList.add('active');
        });
    }

    if(closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Fecha o modal ao clicar fora
    modalOverlay.addEventListener('click', (event) => {
        if(event.target === modalOverlay) closeModal();
    });

    // Fecha o modal ao pressionar a tecla ESC
    document.addEventListener('keydown', (event) => {
        if(event.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
}

function closeModal() {
    if(modalOverlay) modalOverlay.classList.remove('active');
    if(transactionForm) transactionForm.reset();
    editingTransactionId = null;
}

function initTypeSelection() {
    if(!allTypeButton || !incomeTypeButton || !expenseTypeButton)
        return;

    allTypeButton.onclick = () => {
        selectedTypeButton = 'all';
        updateTransactions(selectedTypeButton, searchTextContent);
        updateTypeSelection();
    }
    incomeTypeButton.onclick = () => {
        selectedTypeButton = 'income';
        updateTransactions(selectedTypeButton, searchTextContent);
        updateTypeSelection();
    }
    expenseTypeButton.onclick = () => {
        selectedTypeButton = 'expense';
        updateTransactions(selectedTypeButton, searchTextContent);
        updateTypeSelection();
    }
}

function updateTypeSelection() {
    if(!allTypeButton || !incomeTypeButton || !expenseTypeButton)
        return;

    allTypeButton.classList.remove('active');
    incomeTypeButton.classList.remove('active');
    expenseTypeButton.classList.remove('active');

    switch(selectedTypeButton) {
        case 'income': incomeTypeButton.classList.add('active'); break;
        case 'expense': expenseTypeButton.classList.add('active'); break;
        default: allTypeButton.classList.add('active'); break;
    }
}

function initSearchBar() {
    if(!searchInput)
        return;

    searchInput.addEventListener('input', (event) => {
        searchTextContent = event.target.value;
        updateTransactions(selectedTypeButton, searchTextContent);
    })
}

/* ==========================================================================
   5. Formatadores
   ========================================================================== */
function formatDate(dateString) {
    if(!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function formatCurrency(amount) {
    return (amount || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/* ==========================================================================
   6. Inicialização
   ========================================================================== */
function init() {
    initCompactMenu();
    initTransactionModal();
    initTypeSelection();
    initSearchBar();
    updateTransactions();
    updateCards();
    updateCategories();
}

init();