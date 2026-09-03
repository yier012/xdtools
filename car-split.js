const MAX_ATTEMPTS = 500;

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
let drivers = [];
let passengers = [];
let ruleIdCounter = 0;

fetch('/api/members')
  .then((res) => res.json())
  .then((data) => {
    allMembers = data.members || [];
    drivers = allMembers.filter((m) => m.role === 'driver');
    passengers = allMembers.filter(
      (m) => m.role !== 'driver' && m.role !== 'not_participating'
    );

    loadingText.style.display = 'none';
    controlsView.hidden = false;

    if (drivers.length !== 2) {
      driverWarning.hidden = false;
      driverWarning.textContent =
        `目前後台設定了 ${drivers.length} 個駕駛,要剛好 2 個才能分車。去後台把身分改一下吧。`;
      splitBtn.disabled = true;
    }

    addRuleRow();
  })
  .catch(() => {
    loadingText.textContent = '讀取失敗,重新整理看看';
  });

function buildMemberOptions(selectEl, selectedId) {
  selectEl.innerHTML = '<option value="">-- 選人 --</option>';
  allMembers.forEach((member) => {
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
  const shuffledDrivers = shuffle(drivers);
  const [driverA, driverB] = shuffledDrivers;

  const shuffledPassengers = shuffle(passengers);
  const seatsA = Math.ceil(shuffledPassengers.length / 2);
  const carAPassengers = shuffledPassengers.slice(0, seatsA);
  const carBPassengers = shuffledPassengers.slice(seatsA);

  const carAIds = [driverA.id, ...carAPassengers.map((m) => m.id)];
  const carBIds = [driverB.id, ...carBPassengers.map((m) => m.id)];

  const allRulesPass = rules.every((rule) => {
    const carOfA = carOf(rule.personAId, carAIds, carBIds);
    const carOfB = carOf(rule.personBId, carAIds, carBIds);

    // 如果規則裡的人剛好不參與抽車,這條規則就不管它
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
    setupError.textContent = '規則可能互相矛盾,找不到符合的分法,調整一下規則再試試';
    return;
  }

  renderCarMembers(carAMembersEl, result.driverA, result.carAPassengers);
  renderCarMembers(carBMembersEl, result.driverB, result.carBPassengers);
  carsView.hidden = false;
  splitBtn.textContent = '再抽一次';
}

addRuleBtn.addEventListener('click', addRuleRow);
splitBtn.addEventListener('click', runSplit);
