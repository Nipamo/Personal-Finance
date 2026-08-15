const STORAGE_KEY = 'personal_finance_bank_accounts';
const add_bank_account_trigger = document.querySelectorAll('.fn-add_bank_account');
const account_modal = document.getElementById('account-modal');
const account_form = document.getElementById('account-form');
const bank_accounts_container = document.getElementById('container-bank_accounts');
const total_balance_value = document.getElementById('total-balance-value');
const total_account_count = document.getElementById('total-account-count');
let saved_accounts = [];

add_bank_account_trigger.forEach(button => {
    button.addEventListener('click', openAccountModal);
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

    const account = {
        institute,
        name,
        type,
        balance,
    };

    saved_accounts.push(account);
    saveAccounts();

    const account_card = CreateNewBankAccount(account);
    const add_card_button = document.querySelector('.account-card--add');
    if (add_card_button) {
        bank_accounts_container.insertBefore(account_card, add_card_button);
    } else {
        bank_accounts_container.appendChild(account_card);
    }

    UpdateSummary();
    account_form.reset();
    closeAccountModal();
});

initializeAccounts();

function initializeAccounts() {
    saved_accounts = loadAccounts();

    saved_accounts.forEach(account => {
        const account_card = CreateNewBankAccount(account);
        const add_card_button = document.querySelector('.account-card--add');

        if (add_card_button) {
            bank_accounts_container.insertBefore(account_card, add_card_button);
        } else {
            bank_accounts_container.appendChild(account_card);
        }
    });

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

        return parsed_accounts.map(account => ({
            institute: String(account.institute || 'Institut'),
            name: String(account.name || 'Konto'),
            type: String(account.type || 'Konto'),
            balance: Number.parseFloat(account.balance) || 0,
        }));
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

function openAccountModal() {
    if (!account_modal) return;
    account_modal.hidden = false;
    const first_input = account_form.querySelector('input');
    if (first_input) first_input.focus();
}

function closeAccountModal() {
    if (!account_modal) return;
    account_modal.hidden = true;
    account_form.reset();
}

function CreateNewBankAccount({ institute, name, type, balance = 0 }) {
    const bank_account_article = document.createElement('article');
    bank_account_article.classList.add('account-card');
    bank_account_article.dataset.balance = String(Number.isFinite(balance) ? balance : 0);

    const bank_account_institute_p = CreateBankAccountInstitute(institute);
    const bank_account_name_span = CreateBankAccountName(name);
    const bank_account_type_span = CreateBankAccountType(type);
    const bank_account_balance_span = CreateBankAccountBalance(balance);

    bank_account_article.appendChild(bank_account_institute_p);
    bank_account_article.appendChild(bank_account_name_span);
    bank_account_article.appendChild(bank_account_type_span);
    bank_account_article.appendChild(bank_account_balance_span);

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

UpdateSummary();