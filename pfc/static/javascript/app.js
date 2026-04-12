document.addEventListener('DOMContentLoaded', () => {
  // ===== DOM =====
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

  const calcBtn = document.getElementById('calcBtn');
  const resetBtn = document.getElementById('resetBtn');

  const presetBtns = document.querySelectorAll('.preset-buttons .preset');

  const sourceTabs = document.querySelectorAll('.source-tab');
  const sourceLists = document.querySelectorAll('.source-list');

  const loginUsernameEl = document.getElementById('loginUsername');
  const loginPasswordEl = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const authStatus = document.getElementById('authStatus');

  const historyList = document.getElementById('historyList');
  const historyStatus = document.getElementById('historyStatus');

  // ===== CSRF =====
  function getCookie(name) {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '='));
    return cookieValue ? decodeURIComponent(cookieValue.split('=')[1]) : '';
  }

  async function postJSON(url, payload) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  async function getJSON(url) {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin'
    });

    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  // ===== AUTH =====
  function setAuthMessage(text, type = 'info') {
    if (!authStatus) return;
    authStatus.textContent = text;
    authStatus.className = `auth-status ${type}`;
  }

  async function registerUser() {
    if (!loginUsernameEl || !loginPasswordEl) return;

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

    try {
      const { response, data } = await postJSON('/register/', { username, password });
      if (!response.ok) {
        setAuthMessage(data.message || 'Ошибка регистрации.', 'error');
        return;
      }

      setAuthMessage(data.message || `Пользователь ${username} создан.`, 'success');
      await loadWeightHistory();
    } catch (error) {
      console.error(error);
      setAuthMessage('Ошибка сети при регистрации.', 'error');
    }
  }

  async function loginUser() {
    if (!loginUsernameEl || !loginPasswordEl) return;

    const username = loginUsernameEl.value.trim();
    const password = loginPasswordEl.value.trim();

    if (!username || !password) {
      setAuthMessage('Введите логин и пароль.', 'error');
      return;
    }

    try {
      const { response, data } = await postJSON('/login/', { username, password });
      if (!response.ok) {
        setAuthMessage(data.message || 'Ошибка входа.', 'error');
        return;
      }

      setAuthMessage(data.message || `Вход выполнен: ${username}`, 'success');
      await loadWeightHistory();
    } catch (error) {
      console.error(error);
      setAuthMessage('Ошибка сети при входе.', 'error');
    }
  }

  // ===== SOURCES =====
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
    tab.addEventListener('click', () => setActiveSource(tab.dataset.target));
  });

  if (sourceTabs.length > 0) {
    setActiveSource(sourceTabs[0].dataset.target);
  }

  // ===== PRESETS =====
  function setActivePreset(clickedBtn) {
    presetBtns.forEach(btn => {
      const isActive = btn === clickedBtn;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  }

  function getSelectedPreset() {
    const active = document.querySelector('.preset-buttons .preset.active');
    if (!active && presetBtns.length > 0) {
      return {
        p: Number(presetBtns[0].dataset.p),
        f: Number(presetBtns[0].dataset.f),
        c: Number(presetBtns[0].dataset.c)
      };
    }

    return {
      p: Number(active?.dataset.p ?? 30),
      f: Number(active?.dataset.f ?? 25),
      c: Number(active?.dataset.c ?? 45)
    };
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => setActivePreset(btn));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActivePreset(btn);
      }
    });
  });

  if (presetBtns.length > 0) {
    setActivePreset(presetBtns[0]);
  }

  // ===== HISTORY =====
  function renderHistory(items) {
    if (!historyList || !historyStatus) return;

    historyList.innerHTML = '';

    if (!items || items.length === 0) {
      historyStatus.textContent = 'Записей пока нет.';
      return;
    }

    historyStatus.textContent = `Записей: ${items.length}`;

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `
        <span class="history-date">${item.date}</span>
        <span class="history-weight">Вес: ${Number(item.weight).toFixed(1)} кг</span>
        <span class="history-height">Рост: ${Number(item.height).toFixed(1)} см</span>
      `;
      historyList.appendChild(row);
    });
  }

  async function loadWeightHistory() {
    if (!historyList || !historyStatus) return;

    try {
      const { response, data } = await getJSON('/weight_history/');

      if (!response.ok) {
        historyStatus.textContent = data.message || 'История недоступна.';
        historyList.innerHTML = '';
        return;
      }

      renderHistory(data.items || []);
    } catch (error) {
      console.error(error);
      historyStatus.textContent = 'Ошибка загрузки истории.';
      historyList.innerHTML = '';
    }
  }

  // ===== SAVE TO DB =====
  async function add_to_database(weight, height, age, sex, activity, goal) {
    try {
      const { response, data } = await postJSON('/new_ration/', {
        weight,
        height,
        age,
        sex,
        activity,
        goal
      });

      if (!response.ok) {
        console.error('Server error:', data);
        return data;
      }

      await loadWeightHistory();
      return data;
    } catch (error) {
      console.error('Error adding user data:', error);
      return null;
    }
  }

  // ===== CALCULATE =====
  async function calculate() {
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

    const tdee = Math.round(bmr * activity);
    const target = Math.round(tdee * goalFactor);

    const { p, f, c } = getSelectedPreset();
    const sum = p + f + c;

    let pNorm = p;
    let fNorm = f;
    let cNorm = c;

    if (sum !== 100) {
      pNorm = (p / sum) * 100;
      fNorm = (f / sum) * 100;
      cNorm = (c / sum) * 100;
    }

    const protK = Math.round(target * (pNorm / 100));
    const fatK = Math.round(target * (fNorm / 100));
    const carbK = Math.round(target * (cNorm / 100));

    const protG = protK / 4;
    const fatG = fatK / 9;
    const carbG = carbK / 4;

    bmrOut.textContent = bmr.toLocaleString('ru-RU');
    tdeeOut.textContent = tdee.toLocaleString('ru-RU');
    targetOut.textContent = target.toLocaleString('ru-RU');

    protKcal.textContent = protK.toLocaleString('ru-RU');
    fatKcal.textContent = fatK.toLocaleString('ru-RU');
    carbKcal.textContent = carbK.toLocaleString('ru-RU');

    protGr.textContent = protG % 1 === 0 ? protG.toFixed(0) : protG.toFixed(1);
    fatGr.textContent = fatG % 1 === 0 ? fatG.toFixed(0) : fatG.toFixed(1);
    carbGr.textContent = carbG % 1 === 0 ? carbG.toFixed(0) : carbG.toFixed(1);

    await add_to_database(weight, height, age, sex, activity, goalFactor);
  }

  // ===== RESET =====
  function resetResults() {
    bmrOut.textContent = '—';
    tdeeOut.textContent = '—';
    targetOut.textContent = '—';
    protKcal.textContent = '—';
    fatKcal.textContent = '—';
    carbKcal.textContent = '—';
    protGr.textContent = '—';
    fatGr.textContent = '—';
    carbGr.textContent = '—';
  }

  // ===== EVENTS =====
  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      calculate();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      weightEl.value = 75;
      heightEl.value = 178;
      ageEl.value = 28;
      sexEl.value = 'male';
      activityEl.value = '1.55';
      goalEl.value = '1.0';

      if (presetBtns.length > 0) {
        setActivePreset(presetBtns[0]);
      }

      resetResults();
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', loginUser);
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', registerUser);
  }

  if (loginUsernameEl) {
    loginUsernameEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loginUser();
    });
  }

  if (loginPasswordEl) {
    loginPasswordEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loginUser();
    });
  }

  // ===== INIT =====
  setAuthMessage('Пользователь не авторизован.', 'info');
  loadWeightHistory();
});