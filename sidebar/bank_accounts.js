const STORAGE_KEY = 'personal_finance_bank_accounts';
const add_bank_account_trigger = document.querySelectorAll('.fn-add_bank_account');
const account_modal = document.getElementById('account-modal');
const account_form = document.getElementById('account-form');
const bank_accounts_container = document.getElementById('container-bank_accounts');
const total_balance_value = document.getElementById('total-balance-value');
const total_account_count = document.getElementById('total-account-count');
let saved_accounts = [];

add_bank_account_trigger.forEach(button => {
    button.addEventListener('click', () => openAccountModal());
});

document.querySelectorAll('[data-close="account-modal"]').forEach(element => {
    element.addEventListener('click', closeAccountModal);
});

account_form.addEventListener('submit', (event) => {
    event.preventDefault();

    const form_data = new FormData(account_form);
    const institute = (form_data.get('institute') || '').toString().trim() || 'Institut';
    const name = (form_data.get('name') || '').toString().trim() || 'Konto';
    const type = (form_data.get('type') || '').toString().trim() || 'Konto';
    const balance = Number.parseFloat((form_data.get('balance') || '0').toString()) || 0;
    const editing_id = account_form.dataset.editingAccountId;

    const accountKey = `${institute} | ${name}`;
    const account = {
        id: editing_id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
        institute,
        name,
        type,
        balance,
        accountKey,
    };

    if (editing_id) {
        const index = saved_accounts.findIndex(item => item.id === editing_id);
        if (index >= 0) {
            saved_accounts[index] = account;
        }
    } else {
        saved_accounts.push(account);
    }

    saveAccounts();
    renderAccounts();
    account_form.reset();
    delete account_form.dataset.editingAccountId;
    closeAccountModal();
});

bank_accounts_container.addEventListener('click', (event) => {
    const delete_button = event.target.closest('[data-account-action="delete"]');
    if (delete_button) {
        const account_id = delete_button.dataset.accountId;
        if (!account_id) return;

        const account = saved_accounts.find(item => item.id === account_id);
        if (!account) return;

        const account_key = account.accountKey || `${account.institute} | ${account.name}`;
        const all_budgets = JSON.parse(localStorage.getItem('personal_finance_budgets') || '[]');
        const filtered_budgets = all_budgets.filter((budget) => {
            const budget_account = budget.accountKey || budget.account || '';
            return budget_account !== account_key && budget.account !== account_key;
        });
        localStorage.setItem('personal_finance_budgets', JSON.stringify(filtered_budgets));

        const all_transactions = JSON.parse(localStorage.getItem('personal_finance_transactions') || '[]');
        const filtered_transactions = all_transactions.filter((transaction) => {
            const budget_key = transaction.budgetKey || transaction.accountKey || '';
            return budget_key !== account_key && transaction.accountKey !== account_key;
        });
        localStorage.setItem('personal_finance_transactions', JSON.stringify(filtered_transactions));

        saved_accounts = saved_accounts.filter(item => item.id !== account_id);
        saveAccounts();
        renderAccounts();
        return;
    }

    const edit_button = event.target.closest('[data-account-action="edit"]');
    if (edit_button) {
        const account_id = edit_button.dataset.accountId;
        const account = saved_accounts.find(item => item.id === account_id);
        if (!account) return;

        openAccountModal(account);
    }
});

initializeAccounts();

function initializeAccounts() {
    saved_accounts = loadAccounts();
    renderAccounts();
}

function renderAccounts() {
    if (!bank_accounts_container) return;

    bank_accounts_container.innerHTML = '';
    saved_accounts.forEach(account => {
        const account_card = CreateNewBankAccount(account);
        bank_accounts_container.appendChild(account_card);
    });

    const add_card_button = document.createElement('button');
    add_card_button.type = 'button';
    add_card_button.className = 'account-card account-card--add fn-add_bank_account';
    add_card_button.innerHTML = '<span>+ Konto hinzufügen</span>';
    add_card_button.addEventListener('click', () => openAccountModal());
    bank_accounts_container.appendChild(add_card_button);

    UpdateSummary();
}

function loadAccounts() {
    try {
        const raw_accounts = localStorage.getItem(STORAGE_KEY);

        if (!raw_accounts) {
            return [];
        }

        const parsed_accounts = JSON.parse(raw_accounts);

        if (!Array.isArray(parsed_accounts)) {
            return [];
        }

        return parsed_accounts.map(account => {
            const institute = String(account.institute || 'Institut');
            const name = String(account.name || 'Konto');
            const accountKey = `${institute} | ${name}`;

            return {
                id: String(account.id || account.accountKey || account.key || `${institute}-${name}-${Date.now()}`),
                institute,
                name,
                type: String(account.type || 'Konto'),
                balance: Number.parseFloat(account.balance) || 0,
                accountKey,
            };
        });
    } catch (error) {
        console.warn('Fehler beim Laden der Konten aus dem Local Storage:', error);
        return [];
    }
}

function saveAccounts() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved_accounts));
    } catch (error) {
        console.warn('Fehler beim Speichern der Konten im Local Storage:', error);
    }
}

function UpdateSummary() {
    if (!bank_accounts_container) return;

    const account_cards = bank_accounts_container.querySelectorAll('.account-card:not(.account-card--add)');
    const total_balance = Array.from(account_cards).reduce((sum, card) => {
        const balance = Number.parseFloat(card.dataset.balance || '0');
        return sum + (Number.isFinite(balance) ? balance : 0);
    }, 0);

    const account_count = account_cards.length;

    if (total_balance_value) {
        total_balance_value.textContent = new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(total_balance);
    }

    if (total_account_count) {
        const suffix = account_count === 1 ? 'Konto' : 'Konten';
        total_account_count.textContent = `${account_count} ${suffix} verknüpft`;
        total_account_count.classList.toggle('hero__delta--negative', total_balance < 0);
        total_account_count.classList.toggle('hero__delta--positive', total_balance >= 0);
    }
}

function openAccountModal(account = null) {
    if (!account_modal) return;

    account_form.reset();
    delete account_form.dataset.editingAccountId;

    if (account) {
        account_form.dataset.editingAccountId = account.id;
        account_form.querySelector('[name="institute"]').value = account.institute || '';
        account_form.querySelector('[name="name"]').value = account.name || '';
        account_form.querySelector('[name="type"]').value = account.type || '';
        account_form.querySelector('[name="balance"]').value = String(account.balance || 0);
        const modal_title = document.getElementById('account-modal-title');
        if (modal_title) modal_title.textContent = 'Konto bearbeiten';
    } else {
        const modal_title = document.getElementById('account-modal-title');
        if (modal_title) modal_title.textContent = 'Konto anlegen';
    }

    account_modal.hidden = false;
    const first_input = account_form.querySelector('input');
    if (first_input) first_input.focus();
}

function closeAccountModal() {
    if (!account_modal) return;
    account_modal.hidden = true;
    account_form.reset();
    delete account_form.dataset.editingAccountId;
    const modal_title = document.getElementById('account-modal-title');
    if (modal_title) modal_title.textContent = 'Konto anlegen';
}

function CreateNewBankAccount(account) {
    const { institute, name, type, balance = 0, id } = account;
    const bank_account_article = document.createElement('article');
    bank_account_article.classList.add('account-card');
    bank_account_article.dataset.balance = String(Number.isFinite(balance) ? balance : 0);
    bank_account_article.dataset.accountId = id;

    const bank_account_institute_p = CreateBankAccountInstitute(institute);
    const bank_account_name_span = CreateBankAccountName(name);
    const bank_account_type_span = CreateBankAccountType(type);
    const bank_account_balance_span = CreateBankAccountBalance(balance);
    const bank_account_actions = CreateBankAccountActions(id);

    bank_account_article.appendChild(bank_account_institute_p);
    bank_account_article.appendChild(bank_account_name_span);
    bank_account_article.appendChild(bank_account_type_span);
    bank_account_article.appendChild(bank_account_balance_span);
    bank_account_article.appendChild(bank_account_actions);

    return bank_account_article;
}

function CreateBankAccountInstitute(institute) {
    const bank_account_institute_p = document.createElement('p');
    bank_account_institute_p.classList.add('eyebrow');
    bank_account_institute_p.classList.add('account-card__institute');
    bank_account_institute_p.textContent = institute;

    return bank_account_institute_p;
}

function CreateBankAccountName(name) {
    const bank_account_name_span = document.createElement('span');
    bank_account_name_span.classList.add('account-card__name');
    bank_account_name_span.textContent = name;

    return bank_account_name_span;
}

function CreateBankAccountType(type) {
    const bank_account_type_span = document.createElement('span');
    bank_account_type_span.classList.add('account-card__type');
    bank_account_type_span.textContent = type;

    return bank_account_type_span;
}

function CreateBankAccountBalance(balance) {
    const bank_account_balance_span = document.createElement('span');
    bank_account_balance_span.classList.add('account-card__balance');

    const numeric_balance = Number.isFinite(balance) ? balance : 0;
    const formatted_balance = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
    }).format(numeric_balance);

    bank_account_balance_span.textContent = formatted_balance;
    bank_account_balance_span.dataset.balance = String(numeric_balance);

    if (numeric_balance < 0) {
        bank_account_balance_span.classList.add('account-card__balance--negative');
    } else {
        bank_account_balance_span.classList.add('account-card__balance--positive');
    }

    return bank_account_balance_span;
}

function CreateBankAccountActions(account_id) {
    const actions = document.createElement('div');
    actions.className = 'account-card__actions';

    const edit_button = document.createElement('button');
    edit_button.type = 'button';
    edit_button.className = 'account-card__action account-card__action--secondary';
    edit_button.textContent = 'Bearbeiten';
    edit_button.dataset.accountAction = 'edit';
    edit_button.dataset.accountId = account_id;

    const delete_button = document.createElement('button');
    delete_button.type = 'button';
    delete_button.className = 'account-card__action account-card__action--danger';
    delete_button.textContent = 'Löschen';
    delete_button.dataset.accountAction = 'delete';
    delete_button.dataset.accountId = account_id;

    actions.appendChild(edit_button);
    actions.appendChild(delete_button);
    return actions;
}

UpdateSummary();