// Picolini — Личный кабинет и привязка карты
// Этот файл рассчитан на использование в связке с существующим main.ts:
// - экспортирует функцию renderCabinet(root: HTMLElement)
// - использует модалки/стили из style.css (перенести CSS-блоки из donor/style_с.css)



type CartItem = { productId: string; qty: number };
type Cart = { userId: string; items: CartItem[] };

type User = { id: number; role: string; name: string; email: string; cart?: Cart };

type CardBinding = {
  number: string;
  name: string;
  month: string;
  year: string;
  cvv: string;
  type: string;
};

const API_BASE = 'http://localhost:8000';
const STORAGE_KEY = 'picolini_jwt_token';
const STORAGE_CARD_KEY = 'picolini_bound_card';

const state = {
  token: '' as string,
  user: null as User | null,
  authMode: 'login' as 'login' | 'register',
  authError: '' as string,

  // card modal state
  cardNumber: '' as string,
  cardName: '' as string,
  cardMonth: '' as string,
  cardYear: '' as string,
  cardCvv: '' as string,
  isCardFlipped: false as boolean,
};

function normalizeCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16);
}

function getCardType(cardNumber: string) {
  if (/^34|^37/.test(cardNumber)) return 'amex';
  if (/^4/.test(cardNumber)) return 'visa';
  if (/^5[1-5]/.test(cardNumber)) return 'mastercard';
  if (/^6011/.test(cardNumber)) return 'discover';
  if (/^9792/.test(cardNumber)) return 'troy';
  return 'visa';
}

function formatCardNumberDisplay(cardNumber: string) {
  const normalized = normalizeCardNumber(cardNumber);
  const mask = '#### #### #### ####';
  let result = '';
  let idx = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === '#') {
      result += idx < normalized.length ? normalized[idx] : '_';
      idx += 1;
    } else {
      result += mask[i];
    }
  }
  return result;
}

function setToken(token: string | null) {
  state.token = token || '';
  if (token) localStorage.setItem(STORAGE_KEY, token);
  else localStorage.removeItem(STORAGE_KEY);
}

function getSavedToken() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function loadSavedCard(): CardBinding | null {
  const raw = localStorage.getItem(STORAGE_CARD_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CardBinding;
  } catch {
    return null;
  }
}

function saveCardBinding() {
  const card: CardBinding = {
    number: formatCardNumberDisplay(state.cardNumber),
    name: state.cardName.trim() || 'FULL NAME',
    month: state.cardMonth || 'MM',
    year: state.cardYear || 'YY',
    cvv: state.cardCvv.replace(/\d/g, '*'),
    type: getCardType(normalizeCardNumber(state.cardNumber)),
  };
  localStorage.setItem(STORAGE_CARD_KEY, JSON.stringify(card));
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string> | undefined) || {}),
  };

  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) setToken(null);
    throw new Error((data && (data.error || data.message)) || 'Ошибка запроса');
  }

  return data;
}

async function loadUser() {
  if (!state.token) {
    state.user = null;
    return;
  }

  try {
    const response = await apiFetch('/api/me');
    state.user = response as User;
  } catch {
    state.user = null;
  }
}

function ensureModalsExist() {
  if (!document.getElementById('auth-modal')) {
    const authModal = document.createElement('div');
    authModal.id = 'auth-modal';
    authModal.className = 'modal-backdrop hidden';
    authModal.innerHTML = `
      <div class="modal">
        <button class="modal-close" type="button" aria-label="Закрыть">×</button>
        <div class="modal-title">Личный кабинет</div>
        <div class="auth-tabs">
          <button type="button" class="tab-button active" data-auth-tab="login">Вход</button>
          <button type="button" class="tab-button" data-auth-tab="register">Регистрация</button>
        </div>
        <div id="auth-error" class="alert hidden"></div>
        <form id="auth-form">
          <div class="input-row">
            <label class="input-label">Email
              <input id="auth-email" class="input-field" type="email" name="email" required />
            </label>
            <label class="input-label">Пароль
              <input id="auth-password" class="input-field" type="password" name="password" required minlength="6" />
            </label>
            <div id="auth-name-row" class="input-row hidden">
              <label class="input-label">Имя
                <input id="auth-name" class="input-field" type="text" name="name" />
              </label>
            </div>
          </div>
          <button type="submit" class="btn-primary btn-full">Войти</button>
        </form>
      </div>
    `;
    document.body.appendChild(authModal);
    // Привязываем обработчики сразу после создания модалки
    bindAuthModalListeners();
    authModal.dataset.bound = '1';
  }

  if (!document.getElementById('card-modal')) {
    const cardModal = document.createElement('div');
    cardModal.id = 'card-modal';
    cardModal.className = 'modal-backdrop hidden';
    cardModal.innerHTML = `
      <div class="modal card-modal">
        <button class="modal-close" type="button" aria-label="Закрыть">×</button>
        <div class="modal-title">Привязать карту</div>
        <div class="card-form">
          <div class="card-list">
            <div class="card-item" id="card-preview">
              <div class="card-item__side -front">
                <div class="card-item__focus" id="card-focus"></div>
                <div class="card-item__cover">
                  <img src="https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/01.jpeg" class="card-item__bg" alt="card background">
                </div>
                <div class="card-item__wrapper">
                  <div class="card-item__top">
                    <img src="https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/chip.png" class="card-item__chip" alt="chip">
                    <div class="card-item__type">
                      <img id="card-brand-img" src="" alt="card type" class="card-item__typeImg">
                    </div>
                  </div>
                  <label class="card-item__number" id="card-number-preview"></label>
                  <div class="card-item__content">
                    <label class="card-item__info">
                      <div class="card-item__holder">Card Holder</div>
                      <div class="card-item__name" id="card-holder-name">FULL NAME</div>
                    </label>
                    <div class="card-item__date">
                      <label class="card-item__dateTitle">Expires</label>
                      <label class="card-item__dateItem" id="card-exp-month">MM</label>
                      /
                      <label class="card-item__dateItem" id="card-exp-year">YY</label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-item__side -back">
                <div class="card-item__cover">
                  <img src="https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/01.jpeg" class="card-item__bg" alt="card background">
                </div>
                <div class="card-item__band"></div>
                <div class="card-item__cvv">
                  <div class="card-item__cvvTitle">CVV</div>
                  <div class="card-item__cvvBand" id="card-cvv-preview"></div>
                  <div class="card-item__type">
                    <img id="card-brand-img-back" src="" alt="card type" class="card-item__typeImg">
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-form__inner">
            <form id="card-form">
              <div class="card-input">
                <label for="cardNumber" class="card-input__label">Card Number</label>
                <input type="text" id="cardNumber" class="card-input__input" autocomplete="off" inputmode="numeric" maxlength="19" />
              </div>
              <div class="card-input">
                <label for="cardName" class="card-input__label">Card Holder</label>
                <input type="text" id="cardName" class="card-input__input" autocomplete="off" maxlength="30" />
              </div>
              <div class="card-form__row">
                <div class="card-form__col">
                  <div class="card-form__group">
                    <label for="cardMonth" class="card-input__label">Expiration Date</label>
                    <select class="card-input__input -select" id="cardMonth">
                      <option value="" disabled selected>Month</option>
                      ${Array.from({ length: 12 }, (_, i) => {
                        const v = i + 1;
                        return `<option value="${v < 10 ? '0' + v : v}">${v < 10 ? '0' + v : v}</option>`;
                      }).join('')}
                    </select>
                    <select class="card-input__input -select" id="cardYear">
                      <option value="" disabled selected>Year</option>
                      ${Array.from({ length: 12 }, (_, i) => {
                        const v = new Date().getFullYear() + i;
                        return `<option value="${v}">${v}</option>`;
                      }).join('')}
                    </select>
                  </div>
                </div>
                <div class="card-form__col -cvv">
                  <div class="card-input">
                    <label for="cardCvv" class="card-input__label">CVV</label>
                    <input type="text" id="cardCvv" class="card-input__input" autocomplete="off" maxlength="4" />
                  </div>
                </div>
              </div>
              <button type="submit" class="card-form__button">Привязать карту</button>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(cardModal);
    // Привязываем обработчики сразу после создания модалки
    bindCardModalListeners();
    cardModal.dataset.bound = '1';
  }
}

function renderAuthState() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  // Модальное окно уже открыто через openAuthModal, здесь только обновляем UI

  modal.querySelector('[data-auth-tab="login"]')?.classList.toggle('active', state.authMode === 'login');
  modal.querySelector('[data-auth-tab="register"]')?.classList.toggle('active', state.authMode === 'register');
  modal.querySelector('#auth-name-row')?.classList.toggle('hidden', state.authMode !== 'register');

  const submitButton = modal.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = state.authMode === 'login' ? 'Войти' : 'Зарегистрироваться';

  const authError = document.getElementById('auth-error');
  if (authError) {
    authError.textContent = state.authError;
    authError.classList.toggle('hidden', !state.authError);
  }
}

function updateCardPreview() {
  const numberNode = document.getElementById('card-number-preview');
  const brandImg = document.getElementById('card-brand-img') as HTMLImageElement | null;
  const brandImgBack = document.getElementById('card-brand-img-back') as HTMLImageElement | null;
  const nameNode = document.getElementById('card-holder-name');
  const monthNode = document.getElementById('card-exp-month');
  const yearNode = document.getElementById('card-exp-year');
  const cvvNode = document.getElementById('card-cvv-preview');
  const cardPreview = document.getElementById('card-preview');

  const number = normalizeCardNumber(state.cardNumber);
  const numberText = formatCardNumberDisplay(number);
  const previewType = getCardType(number);

  if (numberNode) numberNode.textContent = numberText;
  if (brandImg) brandImg.src = `https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/${previewType}.png`;
  if (brandImgBack && brandImg) brandImgBack.src = brandImg.src;
  if (nameNode) nameNode.textContent = state.cardName.trim() || 'FULL NAME';
  if (monthNode) monthNode.textContent = state.cardMonth || 'MM';
  if (yearNode) yearNode.textContent = state.cardYear ? String(state.cardYear).slice(2, 4) : 'YY';
  if (cvvNode) cvvNode.textContent = state.cardCvv.replace(/\d/g, '*');

  if (cardPreview) cardPreview.classList.toggle('-active', state.isCardFlipped);
}

function bindCardModalListeners() {
  const cardModal = document.getElementById('card-modal');
  if (!cardModal) return;

  // close
  cardModal.querySelector('.modal-close')?.addEventListener('click', () => {
    closeCardModal();
  });

  // backdrop
  cardModal.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-backdrop')) closeCardModal();
  });

  document.getElementById('card-form')?.addEventListener('submit', handleCardSubmit);
  document.getElementById('cardNumber')?.addEventListener('input', handleCardInput);
  document.getElementById('cardName')?.addEventListener('input', handleCardInput);
  document.getElementById('cardMonth')?.addEventListener('change', handleCardInput);
  document.getElementById('cardYear')?.addEventListener('change', handleCardInput);

  document.getElementById('cardCvv')?.addEventListener('input', (event) => {
    state.cardCvv = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    (event.target as HTMLInputElement).value = state.cardCvv;
    flipCard(true);
    updateCardPreview();
  });
  document.getElementById('cardCvv')?.addEventListener('blur', () => flipCard(false));

  document.getElementById('cardNumber')?.addEventListener('focus', handleCardFocus);
  document.getElementById('cardName')?.addEventListener('focus', handleCardFocus);
  document.getElementById('cardMonth')?.addEventListener('focus', handleCardFocus);
  document.getElementById('cardYear')?.addEventListener('focus', handleCardFocus);
  document.getElementById('cardNumber')?.addEventListener('blur', handleCardBlur);
  document.getElementById('cardName')?.addEventListener('blur', handleCardBlur);
  document.getElementById('cardMonth')?.addEventListener('blur', handleCardBlur);
  document.getElementById('cardYear')?.addEventListener('blur', handleCardBlur);
}

function handleCardInput() {
  state.cardNumber = normalizeCardNumber((document.getElementById('cardNumber') as HTMLInputElement).value);
  (document.getElementById('cardNumber') as HTMLInputElement).value = formatCardNumberDisplay(state.cardNumber);
  state.cardName = (document.getElementById('cardName') as HTMLInputElement).value;
  state.cardMonth = (document.getElementById('cardMonth') as HTMLSelectElement).value;
  state.cardYear = (document.getElementById('cardYear') as HTMLSelectElement).value;
  state.cardCvv = (document.getElementById('cardCvv') as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
  (document.getElementById('cardCvv') as HTMLInputElement).value = state.cardCvv;
  updateCardPreview();
}

function handleCardFocus(event: Event) {
  const target = event.target as HTMLElement;
  const focusBlock = document.getElementById('card-focus');
  if (!focusBlock) return;

  const rect = target.getBoundingClientRect();
  const cardRect = (target.closest('.modal') as HTMLElement).getBoundingClientRect();

  focusBlock.style.width = `${rect.width}px`;
  focusBlock.style.height = `${rect.height}px`;
  focusBlock.style.transform = `translate(${rect.left - cardRect.left}px, ${rect.top - cardRect.top}px)`;
  focusBlock.classList.add('-active');
}

function handleCardBlur() {
  document.getElementById('card-focus')?.classList.remove('-active');
}

function flipCard(status: boolean) {
  state.isCardFlipped = status;
  updateCardPreview();
}

function closeCardModal() {
  document.getElementById('card-modal')?.classList.add('hidden');
}

function openCardModal() {
  const modal = document.getElementById('card-modal');
  modal?.classList.remove('hidden');

  const savedCard = loadSavedCard();
  if (savedCard) {
    state.cardNumber = savedCard.number.replace(/\D/g, '');
    state.cardName = savedCard.name === 'FULL NAME' ? '' : savedCard.name;
    state.cardMonth = savedCard.month !== 'MM' ? savedCard.month : '';
    state.cardYear = savedCard.year !== 'YY' ? `20${savedCard.year}` : '';
    state.cardCvv = '';
  } else {
    state.cardNumber = '';
    state.cardName = '';
    state.cardMonth = '';
    state.cardYear = '';
    state.cardCvv = '';
  }

  state.isCardFlipped = false;
  updateCardPreview();
}

function handleCardSubmit(event: Event) {
  event.preventDefault();

  if (!state.cardNumber || !state.cardName || !state.cardMonth || !state.cardYear || !state.cardCvv) {
    alert('Пожалуйста, заполните все поля карты.');
    return;
  }

  saveCardBinding();
  alert('Карта успешно привязана.');
  closeCardModal();
}

function openAuthModal(mode: 'login' | 'register') {
  ensureModalsExist();
  state.authMode = mode;
  state.authError = '';

  const modal = document.getElementById('auth-modal');
  modal?.classList.remove('hidden');

  renderAuthState();
}

function closeAuthModal() {
  document.getElementById('auth-modal')?.classList.add('hidden');
}

function bindAuthModalListeners() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  modal.querySelector('.modal-close')?.addEventListener('click', closeAuthModal);

  modal.querySelectorAll('[data-auth-tab]')?.forEach((tab) => {
    (tab as HTMLButtonElement).addEventListener('click', () => {
      const mode = (tab as HTMLButtonElement).getAttribute('data-auth-tab');
      if (mode === 'login' || mode === 'register') {
        state.authMode = mode;
        state.authError = '';
        renderAuthState();
      }
    });
  });

  modal.querySelector('form#auth-form')?.addEventListener('submit', handleAuthSubmit);
}

async function handleAuthSubmit(event: Event) {
  event.preventDefault();

  const email = (document.getElementById('auth-email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('auth-password') as HTMLInputElement).value.trim();
  const name = (document.getElementById('auth-name') as HTMLInputElement).value.trim();

  if (!email || !password) {
    state.authError = 'Введите email и пароль.';
    renderAuthState();
    return;
  }

  const path = state.authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
  const body: Record<string, unknown> = { email, password };
  if (state.authMode === 'register') body.name = name || 'Пользователь';

  try {
    const response = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
    if (response.token) {
      setToken(String(response.token));
      await loadUser();
      closeAuthModal();
      renderCabinet(document.getElementById('cabinet-root') || document.body);
      return;
    }

    state.authError = response.error || 'Не удалось выполнить действие.';
  } catch (e) {
    state.authError = e instanceof Error ? e.message : 'Сетевая ошибка.';
  }

  renderAuthState();
}

function renderCabinetHeader() {
  const user = state.user;
  if (!user) {
    return `
      <div class="panel">
        <div class="panel-title">Личный кабинет</div>
        <div class="panel-row">
          <div>Войдите или зарегистрируйтесь, чтобы привязать карту и сохранять данные.</div>
          <button class="btn-primary btn-full btn-lk-open-auth">Войти</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="panel">
      <div class="panel-title">Привет, ${user.name}!</div>
      <div class="panel-row">
        <div>Почта: ${user.email}</div>
        <div>Роль: ${user.role}</div>
        <button class="btn-secondary btn-full btn-lk-open-card">Привязать карту</button>
        <button class="btn-secondary btn-full btn-lk-logout">Выйти</button>
      </div>
    </div>
  `;
}

function bindCabinetActions() {
  document.querySelectorAll('.btn-lk-open-auth').forEach((b) => b.addEventListener('click', () => openAuthModal('login')));
  document.querySelectorAll('.btn-lk-open-card').forEach((b) => b.addEventListener('click', () => openCardModal()));
  document.querySelectorAll('.btn-lk-logout').forEach((b) => b.addEventListener('click', () => handleLogout()));
}

async function handleLogout() {
  setToken(null);
  state.user = null;
  renderCabinet(document.getElementById('cabinet-root') || document.body);
}

export async function renderCabinet(root: HTMLElement) {
  ensureModalsExist();

  if (!state.token) state.token = getSavedToken();
  await loadUser();

  root.innerHTML = `
    <div class="page-container" style="padding-top: 40px;">
      ${renderCabinetHeader()}
    </div>
  `;

  bindCabinetActions();
}

export function openCabinetPage() {
  const root = document.getElementById('cabinet-root');
  if (root) renderCabinet(root);
}

