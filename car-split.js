const MAX_ATTEMPTS = 500;
const MAX_PARTICIPANTS = 10;

const loadingText = document.getElementById('loading-text');
const driverWarning = document.getElementById('driver-warning');
const controlsView = document.getElementById('controls-view');
const rulesList = document.getElementById('rules-list');
const addRuleBtn = document.getElementById('add-rule-btn');
const splitBtn = document.getElementById('split-btn');
const setupError = document.getElementById('setup-error');
const carsView = document.getElementById('cars-view');
const carAMembersEl = document.getElementById('car-a-members');
const carBMembersEl = document.getElementById('car-b-members');

let allMembers = [];
let activeMembers = []; // 排除掉不參與抽車的人
let drivers = [];
let passengers = [];
let ruleIdCounter = 0;

fetch('/api/members')
  .then((res) => res.json())
  .then((data) => {
    allMembers = data.members || [];
    // 排除「不參與抽車」的成員
    activeMembers = allMembers.filter((m) => m.role !== 'not_participating');
    drivers = activeMembers.filter((m) => m.role === 'driver');
    passengers = activeMembers.filter((m) => m.role !== 'driver');

    loadingText.style.display = 'none';
    controlsView.hidden = false;

    // 檢查 1：駕駛數量至少需要 2 人
    if (drivers.length < 2) {
      driverWarning.hidden = false;
      driverWarning.textContent = `目前後台只設定了 ${drivers.length} 個駕駛，至少需要 2 個駕駛才能分車。去後台改一下身分吧！`;
      splitBtn.disabled = true;
      return;
    }

    // 檢查 2：總參與人數上限（兩台 5 人座上限 10 人）
    if (activeMembers.length > MAX_PARTICIPANTS) {
      driverWarning.hidden = false;
      driverWarning.textContent = `參與抽車人數為 ${activeMembers.length} 人，超過兩台車的人數上限（最多 ${MAX_PARTICIPANTS} 人）。`;
      splitBtn.disabled = true;
      return;
    }

    addRuleRow();
  })
  .catch(() => {
    loadingText.textContent = '讀取失敗，請重新整理試試';
  });

// 下拉選單只提供會參與抽車的名單
function buildMemberOptions(selectEl, selectedId) {
  selectEl.innerHTML = '<option value="">-- 選人 --</option>';
  activeMembers.forEach((member) => {
    const option = document.createElement('option');
    option.value = member.id;
    option.textContent = member.name;
    selectEl.appendChild(option);
  });
  if (selectedId) {
    selectEl.value = selectedId;
  }
}

function addRuleRow() {
  ruleIdCounter += 1;
  const row = document.createElement('div');
  row.className = 'rule-row';
  row.dataset.ruleId = ruleIdCounter;

  const personASelect = document.createElement('select');
  const personBSelect = document.createElement('select');
  buildMemberOptions(personASelect);
  buildMemberOptions(personBSelect);

  const relationSelect = document.createElement('select');
  const togetherOption = document.createElement('option');
  togetherOption.value = 'together';
  togetherOption.textContent = '一起坐';
  const apartOption = document.createElement('option');
  apartOption.value = 'apart';
  apartOption.textContent = '分開坐';
  relationSelect.appendChild(togetherOption);
  relationSelect.appendChild(apartOption);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'rule-delete-btn';
  deleteBtn.textContent = '刪除';
  deleteBtn.addEventListener('click', () => row.remove());

  row.appendChild(personASelect);
  row.appendChild(personBSelect);
  row.appendChild(relationSelect);
  row.appendChild(deleteBtn);

  rulesList.appendChild(row);
}

function readRules() {
  const rows = Array.from(rulesList.children);
  const rules = [];

  for (const row of rows) {
    const selects = row.querySelectorAll('select');
    const personAId = selects[0].value;
    const personBId = selects[1].value;
    const relation = selects[2].value;

    if (!personAId || !personBId) {
      return { error: '每一條規則的兩個人都要選喔' };
    }
    if (personAId === personBId) {
      return { error: '同一條規則裡不能選同一個人' };
    }
    rules.push({ personAId, personBId, relation });
  }

  return { rules };
}

function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function carOf(id, carAIds, carBIds) {
  if (carAIds.includes(id)) return 'A';
  if (carBIds.includes(id)) return 'B';
  return null;
}

function attemptSplit(rules) {
  // 1. 打亂所有駕駛，前 2 位擔任開車駕駛
  const shuffledDrivers = shuffle(drivers);
  const driverA = shuffledDrivers[0];
  const driverB = shuffledDrivers[1];

  // 2. 沒被選中的駕駛，自動併入乘客池
  const extraDriversAsPassengers = shuffledDrivers.slice(2);
  const allCurrentPassengers = [...passengers, ...extraDriversAsPassengers];

  // 3. 打亂乘客並盡量平均分配給兩台車
  const shuffledPassengers = shuffle(allCurrentPassengers);
  const seatsA = Math.ceil(shuffledPassengers.length / 2);
  const carAPassengers = shuffledPassengers.slice(0, seatsA);
  const carBPassengers = shuffledPassengers.slice(seatsA);

  const carAIds = [driverA.id, ...carAPassengers.map((m) => m.id)];
  const carBIds = [driverB.id, ...carBPassengers.map((m) => m.id)];

  // 4. 驗證自訂規則
  const allRulesPass = rules.every((rule) => {
    const carOfA = carOf(rule.personAId, carAIds, carBIds);
    const carOfB = carOf(rule.personBId, carAIds, carBIds);

    if (!carOfA || !carOfB) return true;
    if (rule.relation === 'together') return carOfA === carOfB;
    return carOfA !== carOfB;
  });

  if (!allRulesPass) return null;

  return {
    driverA,
    driverB,
    carAPassengers,
    carBPassengers,
  };
}

function renderCarMembers(container, driver, passengerMembers) {
  container.innerHTML = '';

  const driverRow = document.createElement('div');
  driverRow.className = 'car-member-row';
  driverRow.textContent = driver.name;
  const badge = document.createElement('span');
  badge.className = 'driver-badge';
  badge.textContent = '駕駛';
  driverRow.appendChild(badge);
  container.appendChild(driverRow);

  passengerMembers.forEach((member) => {
    const row = document.createElement('div');
    row.className = 'car-member-row';
    row.textContent = member.name;
    container.appendChild(row);
  });
}

function runSplit() {
  setupError.textContent = '';

  const { rules, error } = readRules();
  if (error) {
    setupError.textContent = error;
    return;
  }

  let result = null;
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    result = attemptSplit(rules);
    if (result) break;
  }

  if (!result) {
    setupError.textContent = '規則可能互相矛盾找不到組合，請調整規則後再試試。';
    return;
  }

  renderCarMembers(carAMembersEl, result.driverA, result.carAPassengers);
  renderCarMembers(carBMembersEl, result.driverB, result.carBPassengers);
  carsView.hidden = false;
  splitBtn.textContent = '再抽一次';
}

addRuleBtn.addEventListener('click', addRuleRow);
splitBtn.addEventListener('click', runSplit);
