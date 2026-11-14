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
const API_URL = "http://localhost:3000/transactions";
const balanceCard = document.querySelector('#balance-card .card-value');
const incomeCard = document.querySelector('#income-card .card-value');
const expenseCard = document.querySelector('#expense-card .card-value');
const dashboardTransactions = document.querySelector('#dashboard-transactions ul');
const fullTransactions = document.querySelector('#full-transactions');
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

// Armazena as transações
let transactions = [];

// Lista de categorias disponíveis para classificação das transações
let categories = [
    // Despesas
    {name: 'Alimentação', type: 'expense', icon: 'fa-utensils', color: '#f97316'}, // Laranja
    {name: 'Assinaturas', type: 'expense', icon: 'fa-file-invoice-dollar', color: '#a855f7'}, // Roxo
    {name: 'Casa', type: 'expense', icon: 'fa-house', color: '#14b8a6'}, // Teal (Verde-azulado)
    {name: 'Compras', type: 'expense', icon: 'fa-cart-shopping', color: '#ec4899'}, // Rosa
    {name: 'Dívidas', type: 'expense', icon: 'fa-hand-holding-dollar', color: '#ef4444'}, // Vermelho
    {name: 'Educação', type: 'expense', icon: 'fa-book-open', color: '#3b82f6'}, // Azul
    {name: 'Empresarial', type: 'expense', icon: 'fa-briefcase', color: '#64748b'}, // Slate (Cinza-azulado)
    {name: 'Investimento', type: 'expense', icon: 'fa-chart-line', color: '#10b981'}, // Esmeralda
    {name: 'Lazer', type: 'expense', icon: 'fa-gamepad', color: '#eab308'}, // Amarelo
    {name: 'Pessoal', type: 'expense', icon: 'fa-user', color: '#6366f1'}, // Indigo
    {name: 'Pet', type: 'expense', icon: 'fa-paw', color: '#d97706'}, // Âmbar
    {name: 'Saúde', type: 'expense', icon: 'fa-heart-pulse', color: '#f43f5e'}, // Rose
    {name: 'Serviços', type: 'expense', icon: 'fa-screwdriver-wrench', color: '#06b6d4'}, // Ciano
    {name: 'Taxas', type: 'expense', icon: 'fa-percent', color: '#71717a'}, // Cinza
    {name: 'Transferências', type: 'expense', icon: 'fa-right-left', color: '#0ea5e9'}, // Azul claro
    {name: 'Transporte', type: 'expense', icon: 'fa-bus', color: '#f59e0b'}, // Amarelo-laranja
    {name: 'Vestuário', type: 'expense', icon: 'fa-shirt', color: '#d946ef'}, // Fuchsia
    {name: 'Viagem', type: 'expense', icon: 'fa-plane', color: '#38bdf8'}, // Sky (Azul céu)

    // Receitas
    {name: 'Cashback', type: 'income', icon: 'fa-money-bill-wave', color: '#10b981'}, // Esmeralda
    {name: 'Fatura', type: 'income', icon: 'fa-file-invoice-dollar', color: '#3b82f6'}, // Azul
    {name: 'Presente', type: 'income', icon: 'fa-gift', color: '#ec4899'}, // Rosa
    {name: 'Prêmio', type: 'income', icon: 'fa-trophy', color: '#eab308'}, // Amarelo
    {name: 'Receitas variáveis', type: 'income', icon: 'fa-wallet', color: '#14b8a6'}, // Teal
    {name: 'Renda extra', type: 'income', icon: 'fa-briefcase', color: '#f97316'}, // Laranja
    {name: 'Salário', type: 'income', icon: 'fa-sack-dollar', color: '#34d399'}, // Verde Persouz
    {name: 'Transferências', type: 'income', icon: 'fa-right-left', color: '#0ea5e9'}, // Azul claro
    {name: 'Outros', type: 'income', icon: 'fa-ellipsis', color: '#94a3b8'} // Slate claro
];

// Armazena o ID da transação em edição
let editingTransactionId = null;

// Armazena o ID da transação pendente de exclusão
let pendingDeleteTransactionId = null;

// Armazena a opção selecionada nos botões de Tipo
let selectedTypeButton = 'all';

// Armazena o texto na barra de pesquisa
let searchTextContent = '';

/* ==========================================================================
   2. Renderização do DOM
   ========================================================================== */
function renderTransactions(type = 'all', search = '') {
    const targetContainer = fullTransactions || dashboardTransactions;
    let currentDate = null;

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
        const row = document.createElement('div');
        row.className = 'empty-list-item';
        row.textContent = 'Nenhuma transação encontrada';
        const emptyIcon = document.createElement('i');
        emptyIcon.className = 'fa-solid fa-receipt';
        row.prepend(emptyIcon);
        targetContainer.append(row);
        return;
    }

    // Renderiza apenas as transações válidas
    filtered.forEach(transaction => {
        if(fullTransactions && currentDate !== transaction.date) {
            currentDate = transaction.date;
            const listTitle = document.createElement('h2');
            listTitle.textContent = formatReadableDate(transaction.date);
            targetContainer.append(listTitle);
        }

        const row = document.createElement(fullTransactions ? 'div' : 'li');
        const isIncome = transaction.type === 'income';
        const typeClass = isIncome ? 'income' : 'expense';
        const sign = isIncome ? '+' : '-';

        // Data
        const dateIcon = document.createElement('i');
        const dateCell = document.createElement('div');
        dateIcon.className = 'fa-solid fa-calendar';
        dateCell.className = 'transaction-date';
        dateCell.prepend(dateIcon);
        dateCell.append(` ${formatDate(transaction.date)}`);

        // Categoria
        const categoryIcon = document.createElement('i');
        const categoryCell = document.createElement('div');
        const matchedCategory = categories.find(cat => cat.name === transaction.category);
        const iconClass = matchedCategory ? matchedCategory.icon : 'fa-tag';
        const iconColor = matchedCategory ? matchedCategory.color : '#94a3b8'; 
        categoryIcon.className = `fa-solid ${iconClass}`;
        categoryIcon.style.color = iconColor;
        categoryCell.className = 'transaction-category';
        categoryCell.prepend(categoryIcon);
        categoryCell.append(` ${transaction.category}`);

        // Badge Tipo
        const typeIcon = document.createElement('i');
        const typeCell = document.createElement('div');
        typeIcon.className = `fa-solid fa-arrow-${isIncome ? 'up' : 'down'}`;
        typeCell.className = `badge badge-${typeClass}`;
        typeCell.prepend(typeIcon);
        typeCell.append(` ${isIncome ? 'Receita' : 'Despesa'}`);

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
            deleteButton.onclick = () => openDeleteModal(transaction.id);

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

function renderCategories(selectedCategory = null) {
    if(!categorySelect || !typeSelect) return;

    categorySelect.innerHTML = '';

    const availableCategories = categories.filter(category => category.type === typeSelect.value);
    const firstOption = document.createElement('option');
    firstOption.value = '';
    firstOption.disabled = true;
    firstOption.textContent = 'Selecione uma categoria...';

    if(!selectedCategory || !availableCategories.some(category => category.name === selectedCategory)) {
        firstOption.selected = true;
    }

    categorySelect.append(firstOption);

    availableCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;

        if(selectedCategory && category.name === selectedCategory) {
            option.selected = true;
        }

        categorySelect.append(option);
    });
}

function renderCategoriesPage() {
    const expenseContainer = document.getElementById('expense-categories');
    const incomeContainer = document.getElementById('income-categories');

    if(!expenseContainer || !incomeContainer) return;

    expenseContainer.innerHTML = '';
    incomeContainer.innerHTML = '';

    categories.forEach(category => {
        const card = document.createElement('div');
        card.className = `category-card`;

        // Injeta a cor como uma variável CSS no card para usarmos no style.css
        card.style.setProperty('--cat-color', category.color);

        const icon = document.createElement('i');
        icon.className = `fa-solid ${category.icon}`;
        // Aplica a cor diretamente no ícone
        icon.style.color = category.color;

        const name = document.createElement('span');
        name.textContent = category.name;

        card.append(icon, name);

        if(category.type === 'expense') {
            expenseContainer.append(card);
        } else {
            incomeContainer.append(card);
        }
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

async function loadTransactions() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Erro ao buscar transações");
        transactions = await response.json();
        renderTransactions();
        updateCards();
    } catch (error) {
        console.error(error);
    }
}

/* ==========================================================================
   3. Operações de Adição, Edição e Exclusão
   ========================================================================== */
if(transactionForm) {
    transactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const description = descriptionInput?.value?.trim() || '';
        const date = dateInput?.value || '';
        const category = categorySelect?.value || '';
        const value = Number.parseFloat(valueInput?.value || '0');
        const type = typeSelect?.value || '';

        if(!description || !date || !category || !type || Number.isNaN(value) || value <= 0) {
            alert('Preencha todos os campos corretamente antes de salvar a transação.');
            return;
        }

        const transactionData = {
            description,
            date,
            category,
            value,
            type,
        };

        try {
            const isEditing = editingTransactionId !== null;
            const url = isEditing ? `${API_URL}/${editingTransactionId}` : API_URL;
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                let errorMessage = "Erro ao salvar transação";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.erro || errorMessage;
                } catch {
                    // Ignora erro ao parsear resposta vazia ou não JSON
                }
                throw new Error(errorMessage);
            }

            await loadTransactions();
            closeModal();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Não foi possível salvar a transação.');
        }
    });

    typeSelect?.addEventListener('change', () => {
        renderCategories();
    });
}

function showTransactionForm() {
    if(transactionForm) transactionForm.style.display = 'block';
    const deleteConfirmation = document.querySelector('.delete-confirmation');
    if(deleteConfirmation) deleteConfirmation.style.display = 'none';
}

function ensureDeleteConfirmation() {
    if(!modalOverlay) return null;

    let deleteConfirmation = document.querySelector('.delete-confirmation');

    if(!deleteConfirmation) {
        deleteConfirmation = document.createElement('div');
        deleteConfirmation.className = 'delete-confirmation';
        const message = document.createElement('p');
        message.textContent = 'Deseja realmente excluir esta transação?';

        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'btn btn-secondary btn-cancel-delete';
        btnCancel.textContent = 'Cancelar';

        const btnConfirm = document.createElement('button');
        btnConfirm.type = 'button';
        btnConfirm.className = 'btn btn-danger btn-confirm-delete';
        btnConfirm.textContent = 'Excluir';

        actions.appendChild(btnCancel);
        actions.appendChild(btnConfirm);

        deleteConfirmation.appendChild(message);
        deleteConfirmation.appendChild(actions);

        deleteConfirmation.style.display = 'none';

        const modalContent = modalOverlay.querySelector('.modal-content')
            || modalOverlay.querySelector('.modal-body')
            || modalOverlay.querySelector('.modal-card')
            || modalOverlay;

        if(deleteConfirmation.parentElement !== modalContent) {
            modalContent.appendChild(deleteConfirmation);
        }

        deleteConfirmation.querySelector('.btn-cancel-delete').addEventListener('click', () => {
            closeModal();
        });

        deleteConfirmation.querySelector('.btn-confirm-delete').addEventListener('click', async () => {
            if(pendingDeleteTransactionId === null) return;

            await deleteTransaction(pendingDeleteTransactionId);
            closeModal();
        });
    }

    return deleteConfirmation;
}

function openEditModal(transaction) {
    editingTransactionId = transaction.id;
    pendingDeleteTransactionId = null;
    showTransactionForm();

    if(modalTitle) modalTitle.textContent = 'Editar Transação';

    descriptionInput.value = transaction.description;
    valueInput.value = transaction.value;
    typeSelect.value = transaction.type;
    dateInput.value = transaction.date;
    renderCategories(transaction.category);

    if(modalOverlay) modalOverlay.classList.add('active');
}

function openDeleteModal(id) {
    pendingDeleteTransactionId = id;
    editingTransactionId = null;

    if(transactionForm) transactionForm.style.display = 'none';

    const deleteConfirmation = ensureDeleteConfirmation();
    if(deleteConfirmation) {
        deleteConfirmation.style.display = 'block';
    }

    if(modalTitle) modalTitle.textContent = 'Confirmar exclusão';

    if(modalOverlay) modalOverlay.classList.add('active');
}

async function deleteTransaction(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

        if (!response.ok) {
            throw new Error("Erro ao excluir transação");
        }

        await loadTransactions();
        pendingDeleteTransactionId = null;
    } catch (error) {
        console.error(error);
        alert("Não foi possível excluir a transação.");
    }
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
            pendingDeleteTransactionId = null;
            showTransactionForm();
            if(modalTitle) modalTitle.textContent = 'Adicionar Transação';
            if(transactionForm) transactionForm.reset();

            // Define a data de hoje como padrão (formato YYYY-MM-DD)
            if(dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }

            // Popula as categorias ao abrir o modal para criação
            renderCategories();
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
    if(transactionForm) {
        transactionForm.reset();
        transactionForm.style.display = 'block';
    }

    if(categorySelect) {
        categorySelect.innerHTML = '';
    }

    const deleteConfirmation = document.querySelector('.delete-confirmation');
    if(deleteConfirmation) deleteConfirmation.style.display = 'none';

    editingTransactionId = null;
    pendingDeleteTransactionId = null;
}

function initTypeSelection() {
    if(!allTypeButton || !incomeTypeButton || !expenseTypeButton)
        return;

    allTypeButton.onclick = () => {
        selectedTypeButton = 'all';
        renderTransactions(selectedTypeButton, searchTextContent);
        updateTypeSelection();
    }
    incomeTypeButton.onclick = () => {
        selectedTypeButton = 'income';
        renderTransactions(selectedTypeButton, searchTextContent);
        updateTypeSelection();
    }
    expenseTypeButton.onclick = () => {
        selectedTypeButton = 'expense';
        renderTransactions(selectedTypeButton, searchTextContent);
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
        renderTransactions(selectedTypeButton, searchTextContent);
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

function formatReadableDate(dateString) {
    if(!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const yesterday = new Date(todayDate);
    yesterday.setDate(todayDate.getDate() - 1);

    if(date.getTime() === todayDate.getTime())
        return 'Hoje';

    if(date.getTime() === yesterday.getTime())
        return 'Ontem';

    const dayNames = [
        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado'
    ];

    const startOfWeek = new Date(todayDate);
    const currentDay = todayDate.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    startOfWeek.setDate(todayDate.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if(date >= startOfWeek && date <= endOfWeek)
        return dayNames[date.getDay()];

    const abbreviatedMonths = [
        'jan',
        'fev',
        'mar',
        'abr',
        'mai',
        'jun',
        'jul',
        'ago',
        'set',
        'out',
        'nov',
        'dez'
    ];

    return `${day} de ${abbreviatedMonths[month - 1]}.`;
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
    loadTransactions();
    renderCategories();
    renderCategoriesPage();
}

init();