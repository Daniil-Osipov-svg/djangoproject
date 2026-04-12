document.addEventListener('DOMContentLoaded', () => {

  //REGISTR
  // --- AUTH: вход / регистрация (демо на localStorage) ---
const loginUsernameEl = document.getElementById('loginUsername');
const loginPasswordEl = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authStatus = document.getElementById('authStatus');

const USERS_KEY = 'macrocraft_users';
const CURRENT_USER_KEY = 'macrocraft_current_user';

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setAuthMessage(text, type = 'info') {
  if (!authStatus) return;
  authStatus.textContent = text;
  authStatus.className = `auth-status ${type}`;
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function registerUser() {
  const username = loginUsernameEl.value.trim();
  const password = loginPasswordEl.value.trim();

  if (username.length < 3) {
    setAuthMessage('Логин должен быть не короче 3 символов.', 'error');
    return;
  }

  if (password.length < 4) {
    setAuthMessage('Пароль должен быть не короче 4 символов.', 'error');
    return;
  }

  const users = loadUsers();
  const exists = users.some(user => user.username.toLowerCase() === username.toLowerCase());

  if (exists) {
    setAuthMessage('Такой логин уже существует.', 'error');
    return;
  }

  users.push({ username, password });
  saveUsers(users);

  setCurrentUser({ username });
  setAuthMessage(`Пользователь "${username}" зарегистрирован и выполнен вход.`, 'success');
}

function loginUser() {
  const username = loginUsernameEl.value.trim();
  const password = loginPasswordEl.value.trim();

  if (!username || !password) {
    setAuthMessage('Введите логин и пароль.', 'error');
    return;
  }

  const users = loadUsers();
  const user = users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (!user) {
    setAuthMessage('Неверный логин или пароль.', 'error');
    return;
  }

  setCurrentUser({ username: user.username });
  setAuthMessage(`Добро пожаловать, ${user.username}!`, 'success');
}

function refreshAuthUI() {
  const currentUser = getCurrentUser();
  if (currentUser?.username) {
    setAuthMessage(`Вы вошли как ${currentUser.username}.`, 'success');
  } else {
    setAuthMessage('Пользователь не авторизован.', 'info');
  }
}

if (loginBtn) {
  loginBtn.addEventListener('click', loginUser);
}

if (registerBtn) {
  registerBtn.addEventListener('click', registerUser);
}

if (loginPasswordEl) {
  loginPasswordEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginUser();
  });
}

if (loginUsernameEl) {
  loginUsernameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginUser();
  });
}

refreshAuthUI();


  // DOM
  const weightEl = document.getElementById('weight');
  const heightEl = document.getElementById('height');
  const ageEl = document.getElementById('age');
  const sexEl = document.getElementById('sex');
  const activityEl = document.getElementById('activity');
  const goalEl = document.getElementById('goal');

  const bmrOut = document.getElementById('bmr');
  const tdeeOut = document.getElementById('tdee');
  const targetOut = document.getElementById('targetCals');

  const protKcal = document.getElementById('protKcal');
  const fatKcal = document.getElementById('fatKcal');
  const carbKcal = document.getElementById('carbKcal');

  const protGr = document.getElementById('protGr');
  const fatGr = document.getElementById('fatGr');
  const carbGr = document.getElementById('carbGr');

  const presetBtns = document.querySelectorAll('.preset-buttons .preset');
  const calcBtn = document.getElementById('calcBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Helpers
  function setActivePreset(clickedBtn) {
    presetBtns.forEach(btn => {
      const isActive = btn === clickedBtn;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  }

  // Get selected preset values
  function getSelectedPreset() {
    const active = document.querySelector('.preset-buttons .preset.active');
    if (!active) {
      // fallback to first
      return {
        p: Number(presetBtns[0].dataset.p),
        f: Number(presetBtns[0].dataset.f),
        c: Number(presetBtns[0].dataset.c)
      };
    }
    return {
      p: Number(active.dataset.p),
      f: Number(active.dataset.f),
      c: Number(active.dataset.c)
    };
  }

  // Apply preset (keeps UI only)
  function applyPresetFromButton(btn) {
    setActivePreset(btn);
  }

  // Attach click handlers to presets
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      applyPresetFromButton(btn);
    });
    // keyboard support (Enter/Space)
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        applyPresetFromButton(btn);
      }
    });
  });

  function calculate() {
    const weight = parseFloat(weightEl.value);
    const height = parseFloat(heightEl.value);
    const age = parseFloat(ageEl.value);
    const sex = sexEl.value;
    const activity = parseFloat(activityEl.value);
    const goalFactor = parseFloat(goalEl.value);
    if (!weight || !height || !age) {
      alert('Пожалуйста, заполните вес, рост и возраст корректно.');
      return;
    }
    let bmr;
    if (sex === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    bmr = Math.round(bmr);
    let tdee = Math.round(bmr * activity);
    const target = Math.round(tdee * goalFactor);
    const { p, f, c } = getSelectedPreset();
    const sum = p + f + c;
    let pNorm = p, fNorm = f, cNorm = c;
    if (sum !== 100) {
      pNorm = (p / sum) * 100;
      fNorm = (f / sum) * 100;
      cNorm = (c / sum) * 100;
    }
    const protK = Math.round(target * (pNorm / 100));
    const fatK = Math.round(target * (fNorm / 100));
    const carbK = Math.round(target * (cNorm / 100));
    const protG = (protK / 4);
    const fatG = (fatK / 9);
    const carbG = (carbK / 4);
    bmrOut.textContent = bmr.toLocaleString('ru-RU');
    tdeeOut.textContent = tdee.toLocaleString('ru-RU');
    targetOut.textContent = target.toLocaleString('ru-RU');
    protKcal.textContent = protK.toLocaleString('ru-RU');
    fatKcal.textContent = fatK.toLocaleString('ru-RU');
    carbKcal.textContent = carbK.toLocaleString('ru-RU');

    protGr.textContent = protG % 1 === 0 ? protG.toFixed(0) : protG.toFixed(1);
    fatGr.textContent = fatG % 1 === 0 ? fatG.toFixed(0) : fatG.toFixed(1);
    carbGr.textContent = carbG % 1 === 0 ? carbG.toFixed(0) : carbG.toFixed(1);
  }

  // кнопки
  calcBtn.addEventListener('click', () => calculate());
  resetBtn.addEventListener('click', () => {
    // сброс к дефолту (первая кнопка)
    weightEl.value = 75;
    heightEl.value = 178;
    ageEl.value = 28;
    sexEl.value = 'male';
    activityEl.value = '1.55';
    goalEl.value = '1.0';

    // активировать первый пресет
    setActivePreset(presetBtns[0]);

    bmrOut.textContent = '—';
    tdeeOut.textContent = '—';
    targetOut.textContent = '—';
    protKcal.textContent = '—';
    fatKcal.textContent = '—';
    carbKcal.textContent = '—';
    protGr.textContent = '—';
    fatGr.textContent = '—';
    carbGr.textContent = '—';
  });

  // init: ensure first preset active
  setActivePreset(presetBtns[0]);

  // НОВЫЙ JS-БЛОК ДЛЯ ПЕРЕКЛЮЧЕНИЯ КАТЕГОРИЙ
  const sourceTabs = document.querySelectorAll('.source-tab');
  const sourceLists = document.querySelectorAll('.source-list');

  function setActiveSource(target) {
    sourceTabs.forEach(tab => {
      const isActive = tab.dataset.target === target;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    sourceLists.forEach(list => {
      list.classList.toggle('active', list.dataset.panel === target);
    });
  }

  sourceTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setActiveSource(tab.dataset.target);
    });
  });

  // стартовая категория
  setActiveSource('protein');
});