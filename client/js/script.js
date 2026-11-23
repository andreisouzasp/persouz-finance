/* ==========================================================================
   PERSOUZ FINANCE - SUMÁRIO (TABLE OF CONTENTS)
   ==========================================================================
   1. Variáveis Globais e Seletores
   2. Renderização do DOM
   3. Operações de Adição, Edição e Exclusão
   4. Componentes Interativos
   5. Formatadores
   6. Autenticação
   7. Inicialização
   ========================================================================== */

/* ==========================================================================
   1. Variáveis Globais e Seletores
   ========================================================================== */
const apiBaseUrl = 'http://localhost:3000';
const balanceCard = document.querySelector('#balance-card .card-value');
const incomeCard = document.querySelector('#income-card .card-value');
const expenseCard = document.querySelector('#expense-card .card-value');
const dashboardTransactions = document.querySelector('#dashboard-transactions ul');
const fullTransactions = document.querySelector('#full-transactions');
const modalOverlay = document.querySelector('#modal');
const modalTitle = document.querySelector('.modal-header h3');
const transactionForm = document.querySelector('#transaction-form');
const descriptionInput = document.querySelector('#desc');
const valueInput = document.querySelector('#amount');
const typeSelect = document.querySelector('#type');
const dateInput = document.querySelector('#date');
const allTypeButton = document.querySelector('#btn-type-all');
const incomeTypeButton = document.querySelector('#btn-type-income');
const expenseTypeButton = document.querySelector('#btn-type-expense');
const searchInput = document.querySelector('#search');
const categorySelect = document.querySelector('#category');
const categoryForm = document.querySelector('#category-form');
const categoryNameInput = document.querySelector('#category-name');
const categoryTypeSelect = document.querySelector('#category-type');
const categoryDeleteButton = document.querySelector('#btn-delete-category');
const categoryIconPicker = document.querySelector('#category-icon-picker');
const categoryColorPicker = document.querySelector('#category-color-picker');
const loginForm = document.querySelector('#auth-form');
const registerForm = document.querySelector('#register-form');
const logoutButton = document.querySelector('#logout-btn');
const userNameElements = document.querySelectorAll('.user-name');
const monthFilterInput = document.querySelector('#filter-month');
const clearMonthButton = document.querySelector('#btn-clear-month');
const expensesChartCanvas = document.querySelector('#expenses-chart');
const expensesBreakdown = document.querySelector('#expenses-breakdown');
const expensesAnalyticsContent = document.querySelector('#expenses-analytics-content');
const expensesChartEmpty = document.querySelector('#expenses-chart-empty');

// Ícones e cores das categorias
const categoryIcons = [
    'fa-tag', 'fa-utensils', 'fa-house', 'fa-car', 'fa-gamepad', 'fa-heart-pulse',
    'fa-graduation-cap', 'fa-plane', 'fa-sack-dollar', 'fa-wallet', 'fa-gift', 'fa-briefcase',
    'fa-cart-shopping', 'fa-shirt', 'fa-paw', 'fa-basketball', 'fa-dumbbell', 'fa-bicycle',
    'fa-bus', 'fa-train', 'fa-bed', 'fa-building', 'fa-tree', 'fa-leaf',
    'fa-film', 'fa-music', 'fa-book', 'fa-camera', 'fa-mobile-screen', 'fa-laptop',
    'fa-wifi', 'fa-phone', 'fa-baby', 'fa-person-running', 'fa-pills', 'fa-stethoscope'
];
const categoryColors = [
    '#94a3b8', '#8b5cf6', '#f43f5e', '#f59e0b', '#34d399', '#3b82f6',
    '#9333ea', '#ef4444', '#22c55e', '#2563eb', '#a855f7', '#f97316',
    '#eab308', '#14b8a6', '#06b6d4', '#ec4899', '#64748b', '#78716c',
    '#84cc16', '#10b981', '#0ea5e9', '#6366f1', '#d946ef', '#fb7185',
    '#facc15', '#fb923c', '#a3e635', '#2dd4bf', '#38bdf8', '#c084fc'
];

// Armazena as transações e categorias
let transactions = [];
let categories = [];

// Armazena o ID da transação em edição
let editingTransactionId = null;

// Armazena o ID da transação pendente de exclusão
let pendingDeleteTransactionId = null;

// Armazena o ID da categoria em edição
let editingCategoryId = null;

// Armazena o ID da categoria pendente de exclusão
let pendingDeleteCategoryId = null;

// Guarda a aparência selecionada para uma categoria
let selectedCategoryIcon = 'fa-tag';
let selectedCategoryColor = '#94a3b8';

// Armazena a opção selecionada nos botões de Tipo
let selectedTypeButton = 'all';

// Armazena o texto na barra de pesquisa
let searchTextContent = '';

// Armazena o mês selecionado do filtro de transações e gráfico
let selectedMonth = '';
let expensesChartInstance = null;

/* ==========================================================================
   2. Renderização do DOM
   ========================================================================== */
function renderTransactions(type = 'all', search = '', month = '') {
    const targetContainer = fullTransactions || dashboardTransactions;
    let currentDate = null;

    if (!targetContainer) return;

    targetContainer.innerHTML = '';

    // No Dashboard, mantém as últimas adicionadas (maior ID); no histórico completo, ordena por data
    let filtered = [...transactions].sort((a, b) => {
        if (dashboardTransactions) {
            return b.id - a.id;
        }
        return new Date(b.date) - new Date(a.date) || b.id - a.id;
    });

    // Filtro de data exclusivo da página de Transações
    if (fullTransactions && month) {
        filtered = filtered.filter(transaction => transaction.date.startsWith(month));
    }

    // Aplica o filtro de Tipo
    if (type !== 'all') {
        filtered = filtered.filter(transaction => transaction.type === type);
    }

    // Aplica o filtro de Busca por Descrição
    if (search.trim() !== '') {
        filtered = filtered.filter(transaction =>
            transaction.description.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Na página principal (Visão Geral), limita às 10 últimas adicionadas
    if (dashboardTransactions) {
        filtered = filtered.slice(0, 10);
    }

    // Se a lista filtrada for vazia (ou sem dados originais), mostra o Estado Vazio
    if (filtered.length === 0) {
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
        if (fullTransactions && currentDate !== transaction.date) {
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
        const matchedCategory = categories.find(
            cat => cat.name === transaction.category && cat.type === transaction.type
        );
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
        if (fullTransactions) {
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
    if (!categorySelect || !typeSelect) return;

    categorySelect.innerHTML = '';

    const availableCategories = categories.filter(category => category.type === typeSelect.value);
    const firstOption = document.createElement('option');
    firstOption.value = '';
    firstOption.disabled = true;
    firstOption.textContent = 'Selecione uma categoria...';

    if (!selectedCategory || !availableCategories.some(category => category.name === selectedCategory)) {
        firstOption.selected = true;
    }

    categorySelect.append(firstOption);

    availableCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;

        if (selectedCategory && category.name === selectedCategory) {
            option.selected = true;
        }

        categorySelect.append(option);
    });
}

function renderCategoriesPage() {
    const expenseContainer = document.getElementById('expense-categories');
    const incomeContainer = document.getElementById('income-categories');

    if (!expenseContainer || !incomeContainer) return;

    expenseContainer.innerHTML = '';
    incomeContainer.innerHTML = '';

    categories.forEach(category => {
        const card = document.createElement('div');
        card.className = `category-card`;
        card.style.setProperty('--cat-color', category.color);
        card.onclick = () => openCategoryModal(category);

        const icon = document.createElement('i');
        icon.className = `fa-solid ${category.icon}`;
        icon.style.color = category.color;

        const name = document.createElement('span');
        name.textContent = category.name;

        card.append(icon, name);

        if (category.user_id !== null) {
            const editIcon = document.createElement('i');
            editIcon.className = 'fa-solid fa-pencil';
            editIcon.style.cssText = 'position:absolute;top:8px;right:8px;opacity:0;transition:opacity 0.2s ease;pointer-events:none;font-size:0.75rem;';
            card.style.position = 'relative';
            card.append(editIcon);
            card.addEventListener('mouseenter', () => editIcon.style.opacity = '1');
            card.addEventListener('mouseleave', () => editIcon.style.opacity = '0');
        }

        if (category.type === 'expense') {
            expenseContainer.append(card);
        } else {
            incomeContainer.append(card);
        }
    });
}

function updateCards() {
    if (!balanceCard || !incomeCard || !expenseCard) return;

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'income') totalIncome += transaction.value;
        if (transaction.type === 'expense') totalExpense += transaction.value;
    });

    balanceCard.textContent = formatCurrency(totalIncome - totalExpense);
    incomeCard.textContent = `+ ${formatCurrency(totalIncome)}`;
    expenseCard.textContent = `- ${formatCurrency(totalExpense)}`;
}

function renderExpensesChart() {
    if (!expensesChartCanvas || !expensesBreakdown) return;

    const expenses = transactions.filter(t => t.type === 'expense');

    if (expenses.length === 0) {
        if (expensesAnalyticsContent) expensesAnalyticsContent.style.display = 'none';
        if (expensesChartEmpty) expensesChartEmpty.style.display = 'flex';
        if (expensesChartInstance) {
            expensesChartInstance.destroy();
            expensesChartInstance = null;
        }
        return;
    }

    if (expensesAnalyticsContent) expensesAnalyticsContent.style.display = 'grid';
    if (expensesChartEmpty) expensesChartEmpty.style.display = 'none';

    const totalsByCategory = {};
    let totalExpenses = 0;

    expenses.forEach(item => {
        totalsByCategory[item.category] = (totalsByCategory[item.category] || 0) + item.value;
        totalExpenses += item.value;
    });

    const sortedCategories = Object.entries(totalsByCategory)
        .map(([name, total]) => {
            const matched = categories.find(cat => cat.name === name && cat.type === 'expense');
            return {
                name,
                total,
                color: matched?.color || '#10b981',
                icon: matched?.icon || 'fa-tag',
                percent: totalExpenses > 0 ? ((total / totalExpenses) * 100).toFixed(1) : '0.0'
            };
        })
        .sort((a, b) => b.total - a.total);

    // Renderiza lista detalhada ao lado do gráfico
    expensesBreakdown.innerHTML = '';
    sortedCategories.forEach(item => {
        const row = document.createElement('div');
        row.className = 'breakdown-item';

        const top = document.createElement('div');
        top.className = 'breakdown-top';

        const label = document.createElement('div');
        label.className = 'breakdown-label';

        const dot = document.createElement('span');
        dot.className = 'breakdown-dot';
        dot.style.backgroundColor = item.color;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;

        label.append(dot, nameSpan);

        const values = document.createElement('div');
        values.className = 'breakdown-values';

        const amountSpan = document.createElement('span');
        amountSpan.textContent = formatCurrency(item.total);

        const percentSpan = document.createElement('span');
        percentSpan.className = 'breakdown-percent';
        percentSpan.textContent = `${item.percent}%`;

        values.append(amountSpan, percentSpan);
        top.append(label, values);

        const barBg = document.createElement('div');
        barBg.className = 'breakdown-bar-bg';

        const barFill = document.createElement('div');
        barFill.className = 'breakdown-bar-fill';
        barFill.style.width = `${item.percent}%`;
        barFill.style.backgroundColor = item.color;

        barBg.append(barFill);
        row.append(top, barBg);
        expensesBreakdown.append(row);
    });

    // Renderiza gráfico Doughnut com Chart.js
    if (typeof Chart !== 'undefined') {
        if (expensesChartInstance) {
            expensesChartInstance.destroy();
        }

        expensesChartInstance = new Chart(expensesChartCanvas, {
            type: 'doughnut',
            data: {
                labels: sortedCategories.map(c => c.name),
                datasets: [{
                    data: sortedCategories.map(c => c.total),
                    backgroundColor: sortedCategories.map(c => c.color),
                    borderColor: '#0b1322',
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#e2e8f0',
                        bodyColor: '#34d399',
                        borderColor: 'rgba(52, 211, 153, 0.35)',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: (context) => ` ${formatCurrency(context.parsed)}`
                        }
                    }
                }
            }
        });
    }
}

async function loadTransactions() {
    const response = await authFetch(`${apiBaseUrl}/transactions`);

    if (!response.ok) {
        throw new Error('Erro ao buscar transações');
    }

    transactions = await response.json();
    updateCards();
    renderExpensesChart();
    renderTransactions(selectedTypeButton, searchTextContent, selectedMonth);
}

async function loadCategories() {
    const response = await authFetch(`${apiBaseUrl}/categories`);

    if (!response.ok) {
        throw new Error('Erro ao buscar categorias');
    }

    categories = await response.json();
    renderCategories();
    renderCategoriesPage();
}

/* ==========================================================================
   3. Operações de Adição, Edição e Exclusão
   ========================================================================== */
if (transactionForm) {
    transactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const description = descriptionInput?.value?.trim() || '';
        const date = dateInput?.value || '';
        const category = categorySelect?.value || '';
        const value = Number.parseFloat(valueInput?.value || '0');
        const type = typeSelect?.value || '';

        if (!description || !date || !category || !type || Number.isNaN(value) || value <= 0) {
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
            const url = isEditing ? `${apiBaseUrl}/transactions/${editingTransactionId}` : `${apiBaseUrl}/transactions`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                let errorMessage = 'Erro ao salvar transação';
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

if (categoryForm) {
    categoryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = categoryNameInput?.value?.trim() || '';
        const type = categoryTypeSelect?.value || '';

        if (!name || !type) {
            alert('Preencha todos os campos corretamente antes de salvar a categoria.');
            return;
        }

        const categoryData = {
            name,
            type,
            icon: selectedCategoryIcon,
            color: selectedCategoryColor
        };

        try {
            const isEditing = editingCategoryId !== null;
            const url = isEditing ? `${apiBaseUrl}/categories/${editingCategoryId}` : `${apiBaseUrl}/categories`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });

            if (!response.ok) {
                let errorMessage = 'Erro ao salvar categoria';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.erro || errorMessage;
                } catch {
                    // Ignora erro ao parsear resposta vazia ou não JSON
                }
                throw new Error(errorMessage);
            }

        await loadCategories();
        closeModal();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Não foi possível salvar a categoria.');
        }
    });
}

function showTransactionForm() {
    if (transactionForm) transactionForm.style.display = 'block';
    const deleteConfirmation = document.querySelector('.delete-confirmation');
    if (deleteConfirmation) deleteConfirmation.style.display = 'none';
}

function showCategoryForm() {
    if (categoryForm) categoryForm.style.display = 'block';
    if (categoryDeleteButton) categoryDeleteButton.style.display = 'none';
}

function ensureDeleteConfirmation() {
    if (!modalOverlay) return null;

    let deleteConfirmation = document.querySelector('.delete-confirmation');

    if (deleteConfirmation) {
        if (modalTitle) modalTitle.textContent = 'Confirmar exclusão';
        modalOverlay.classList.add('active');

        const message = deleteConfirmation.querySelector('p');
        if (message) {
            message.textContent = pendingDeleteTransactionId !== null
                ? 'Deseja realmente excluir esta transação?'
                : 'Deseja realmente excluir esta categoria?';
        }
    } else {
        deleteConfirmation = document.createElement('div');
        deleteConfirmation.className = 'delete-confirmation';
        const message = document.createElement('p');
        message.textContent = `Deseja realmente excluir esta ${(pendingDeleteTransactionId) ? 'transação' : 'categoria'}?`;

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

        if (modalTitle) {
            modalTitle.textContent = 'Confirmar exclusão';
        }

        if (modalOverlay) {
            modalOverlay.classList.add('active');
        }

        if (deleteConfirmation.parentElement !== modalContent) {
            modalContent.appendChild(deleteConfirmation);
        }

        deleteConfirmation.querySelector('.btn-cancel-delete').addEventListener('click', () => {
            closeModal();
        });

        deleteConfirmation.querySelector('.btn-confirm-delete').addEventListener('click', async () => {
            if (pendingDeleteTransactionId === null && pendingDeleteCategoryId === null) return;

            if (pendingDeleteTransactionId)
                await deleteTransaction(pendingDeleteTransactionId);
            else if (pendingDeleteCategoryId)
                await deleteCategory(pendingDeleteCategoryId);

            closeModal();
        });
    }

    return deleteConfirmation;
}

function openEditModal(transaction) {
    editingTransactionId = transaction.id;
    pendingDeleteTransactionId = null;
    showTransactionForm();

    if (modalTitle) modalTitle.textContent = 'Editar Transação';

    descriptionInput.value = transaction.description;
    valueInput.value = transaction.value;
    typeSelect.value = transaction.type;
    dateInput.value = transaction.date;
    renderCategories(transaction.category);

    if (modalOverlay) modalOverlay.classList.add('active');
}

function openCategoryModal(category) {
    if (category.user_id === null) {
        alert('Categorias padrão não podem ser editadas ou removidas.');
        return;
    }

    editingCategoryId = category.id;
    showCategoryForm();

    if (modalTitle) modalTitle.textContent = 'Editar Categoria';

    categoryNameInput.value = category.name;
    categoryTypeSelect.value = category.type;
    selectedCategoryIcon = category.icon || 'fa-tag';
    selectedCategoryColor = category.color || '#94a3b8';
    renderCategoryPickers();
    categoryDeleteButton.style.display = 'block';
    categoryDeleteButton.onclick = () => {
        pendingDeleteCategoryId = category.id;
        pendingDeleteTransactionId = null;
        if (categoryForm) categoryForm.style.display = 'none';
        const deleteConfirmation = ensureDeleteConfirmation();
        if (deleteConfirmation) deleteConfirmation.style.display = 'block';
    };

    if (modalOverlay) modalOverlay.classList.add('active');
}

function openDeleteModal(id) {
    pendingDeleteTransactionId = id;
    pendingDeleteCategoryId = null;
    editingTransactionId = null;

    if (transactionForm) transactionForm.style.display = 'none';

    if (modalTitle) modalTitle.textContent = 'Confirmar exclusão';

    const deleteConfirmation = ensureDeleteConfirmation();
    if (deleteConfirmation) {
        const message = deleteConfirmation.querySelector('p');
        if (message) message.textContent = 'Deseja realmente excluir esta transação?';
        deleteConfirmation.style.display = 'block';
    }

    if (modalOverlay) modalOverlay.classList.add('active');
}

async function deleteTransaction(id) {
    try {
        const response = await authFetch(`${apiBaseUrl}/transactions/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            throw new Error('Erro ao excluir transação');
        }

        await loadTransactions();
        pendingDeleteTransactionId = null;
    } catch (error) {
        console.error(error);
        alert('Não foi possível excluir a transação.');
    }
}

async function deleteCategory(id) {
    try {
        const response = await authFetch(`${apiBaseUrl}/categories/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            let errorMessage = 'Não foi possível excluir a categoria.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.erro || errorMessage;
            } catch {
                // Mantém a mensagem padrão quando a resposta não contém JSON.
            }
            throw new Error(errorMessage);
        }

        await loadCategories();
        pendingDeleteCategoryId = null;
    } catch (error) {
        console.error(error);
        alert(error.message || 'Não foi possível excluir a categoria.');
    }
}

/* ==========================================================================
   4. Componentes Interativos
   ========================================================================== */
function initAuth() {
    const user = getStoredUser();

    if (user && user.name) {
        const firstName = user.name.trim().split(' ')[0];
        userNameElements.forEach(el => {
            el.textContent = firstName;
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    document.querySelectorAll('[data-logout]').forEach(button => {
        button.addEventListener('click', logout);
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.querySelector('#email')?.value?.trim() || '';
            const password = document.querySelector('#pass')?.value || '';

            try {
                const response = await fetch(`${apiBaseUrl}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.erro || 'Não foi possível fazer login.');
                }

                saveSession(data.token, data.user);
                window.location.href = 'index.html';
            } catch (error) {
                console.error(error);
                alert(error.message || 'Não foi possível fazer login.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = document.querySelector('#username')?.value?.trim() || '';
            const email = document.querySelector('#email')?.value?.trim() || '';
            const password = document.querySelector('#pass')?.value || '';
            const confirmPassword = document.querySelector('#confirm-pass')?.value || '';

            if (password !== confirmPassword) {
                alert('As senhas não coincidem.');
                return;
            }

            try {
                const response = await fetch(`${apiBaseUrl}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.erro || 'Não foi possível criar a conta.');
                }

                saveSession(data.token, data.user);
                window.location.href = 'index.html';
            } catch (error) {
                console.error(error);
                alert(error.message || 'Não foi possível criar a conta.');
            }
        });
    }
}

function initCompactMenu() {
    const btnMenu = document.querySelector('.btn-menu');
    const nav = document.querySelector('.nav');

    if (!btnMenu || !nav) return;

    const btnMenuIcon = btnMenu.querySelector('i');

    btnMenu.addEventListener('click', (event) => {
        event.stopPropagation();
        nav.classList.toggle('active');
        toggleMenuIcon(btnMenuIcon, nav.classList.contains('active'));
    });

    document.addEventListener('click', (event) => {
        if (!nav.contains(event.target) && !btnMenu.contains(event.target) && nav.classList.contains('active')) {
            nav.classList.remove('active');
            toggleMenuIcon(btnMenuIcon, false);
        }
    });
}

function toggleMenuIcon(iconElement, isActive) {
    if (!iconElement) return;
    iconElement.className = isActive ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
}

function initModal() {
    const openBtn = document.getElementById('open-modal-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    
    if (!modalOverlay) return;
    
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            editingTransactionId = null;
            pendingDeleteTransactionId = null;
            showTransactionForm();
            showCategoryForm();
            if (modalTitle) modalTitle.textContent = (transactionForm) ? 'Nova Transação' : 'Nova Categoria';
            if (transactionForm) transactionForm.reset();
            if (categoryForm) categoryForm.reset();

            // Define a data de hoje como padrão (formato YYYY-MM-DD)
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }

            // Popula as categorias ao abrir o modal para criação
            renderCategories();
            modalOverlay.classList.add('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Fecha o modal ao clicar fora
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) closeModal();
    });

    // Fecha o modal ao pressionar a tecla ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
}

function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove('active');
    if (transactionForm) {
        transactionForm.reset();
        transactionForm.style.display = 'block';
    }

    if (categoryForm) {
        categoryForm.reset();
        categoryForm.style.display = 'block';
    }

    if (categoryDeleteButton) categoryDeleteButton.style.display = 'none';

    if (categorySelect) {
        categorySelect.innerHTML = '';
    }

    const deleteConfirmation = document.querySelector('.delete-confirmation');
    if (deleteConfirmation) deleteConfirmation.style.display = 'none';

    editingTransactionId = null;
    editingCategoryId = null;
    pendingDeleteTransactionId = null;
    pendingDeleteCategoryId = null;
    selectedCategoryIcon = 'fa-tag';
    selectedCategoryColor = '#94a3b8';
    renderCategoryPickers();
}

function initTypeSelection() {
    if (!allTypeButton || !incomeTypeButton || !expenseTypeButton)
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
    if (!allTypeButton || !incomeTypeButton || !expenseTypeButton)
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
    if (!searchInput)
        return;

    searchInput.addEventListener('input', (event) => {
        searchTextContent = event.target.value;
        renderTransactions(selectedTypeButton, searchTextContent);
    })
}

function initDateFilter() {
    if (!monthFilterInput) return;

    monthFilterInput.addEventListener('change', (event) => {
        selectedMonth = event.target.value;
        if (clearMonthButton) {
            clearMonthButton.style.display = selectedMonth ? 'inline-flex' : 'none';
        }
        renderTransactions(selectedTypeButton, searchTextContent, selectedMonth);
    });

    if (clearMonthButton) {
        clearMonthButton.addEventListener('click', () => {
            selectedMonth = '';
            monthFilterInput.value = '';
            clearMonthButton.style.display = 'none';
            renderTransactions(selectedTypeButton, searchTextContent, selectedMonth);
        });
    }
}

function renderCategoryPickers() {
    if (categoryIconPicker) {
        categoryIconPicker.innerHTML = '';

        categoryIcons.forEach(icon => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `icon-picker-option${icon === selectedCategoryIcon ? ' active' : ''}`;
            button.title = icon;

            const iconElement = document.createElement('i');
            iconElement.className = `fa-solid ${icon}`;
            button.append(iconElement);

            button.addEventListener('click', () => {
                selectedCategoryIcon = icon;
                renderCategoryPickers();
            });

            categoryIconPicker.append(button);
        });
    }

    if (categoryColorPicker) {
        categoryColorPicker.innerHTML = '';

        categoryColors.forEach(color => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `color-picker-option${color === selectedCategoryColor ? ' active' : ''}`;
            button.style.setProperty('--picker-color', color);
            button.title = color;

            button.addEventListener('click', () => {
                selectedCategoryColor = color;
                renderCategoryPickers();
            });

            categoryColorPicker.append(button);
        });
    }
}

/* ==========================================================================
   5. Formatadores
   ========================================================================== */
function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function formatReadableDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const yesterday = new Date(todayDate);
    yesterday.setDate(todayDate.getDate() - 1);

    if (date.getTime() === todayDate.getTime())
        return 'Hoje';

    if (date.getTime() === yesterday.getTime())
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

    if (date >= startOfWeek && date <= endOfWeek)
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
   6. Autenticação
   ========================================================================== */

function isPublicPage() {
    const path = window.location.pathname;
    return path.endsWith('login.html') || path.endsWith('register.html');
}

function getToken() {
    return localStorage.getItem('persouz_token');
}

function getStoredUser() {
    try {
        const raw = localStorage.getItem('persouz_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveSession(token, user) {
    localStorage.setItem('persouz_token', token);
    localStorage.setItem('persouz_user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('persouz_token');
    localStorage.removeItem('persouz_user');
    window.location.href = 'login.html';
}

function checkAuthGuard() {
    const token = getToken();
    const publicPage = isPublicPage();

    if (!token && !publicPage) {
        window.location.href = 'login.html';
        return false;
    }

    if (token && publicPage) {
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        logout();
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    return response;
}

/* ==========================================================================
   7. Inicialização
   ========================================================================== */

async function init() {
    if (!checkAuthGuard()) return;

    initAuth();
    initCompactMenu();
    initModal();
    initTypeSelection();
    initSearchBar();
    initDateFilter();
    renderCategoryPickers();

    if (!isPublicPage()) {
        try {
            await loadCategories();
            await loadTransactions();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Não foi possível carregar os dados da conta.');
        }
    }
}

init();