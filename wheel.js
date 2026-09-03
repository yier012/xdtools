// 每一格切換的間隔時間(ms),數字越後面越大 = 越轉越慢,最後停住
const TICK_DELAYS = [
  60, 60, 60, 70, 70, 80, 90, 100, 110, 130,
  150, 180, 210, 250, 300, 360, 430, 510,
];

const loadingText = document.getElementById('loading-text');
const drawView = document.getElementById('draw-view');
const reel = document.getElementById('reel');
const reelText = document.getElementById('reel-text');
const drawBtn = document.getElementById('draw-btn');
const noRepeatCheckbox = document.getElementById('no-repeat-checkbox');
const historyList = document.getElementById('history-list');
const resetBtn = document.getElementById('reset-btn');

let allMembers = [];
let drawnIds = [];

fetch('/api/members')
  .then((res) => res.json())
  .then((data) => {
    allMembers = data.members || [];
    loadingText.style.display = 'none';

    if (allMembers.length === 0) {
      loadingText.style.display = 'block';
      loadingText.textContent = '後台名單是空的,先去加幾個人吧';
      return;
    }

    drawView.hidden = false;
  })
  .catch(() => {
    loadingText.textContent = '讀取失敗,重新整理看看';
  });

function getPool() {
  if (!noRepeatCheckbox.checked) return allMembers;

  const remaining = allMembers.filter((m) => !drawnIds.includes(m.id));
  // 全部人都抽過一輪了,自動重新開放
  return remaining.length > 0 ? remaining : allMembers;
}

function renderHistory() {
  historyList.innerHTML = '';
  drawnIds.forEach((id, index) => {
    const member = allMembers.find((m) => m.id === id);
    if (!member) return;

    const chip = document.createElement('span');
    chip.className = 'history-chip';

    const order = document.createElement('span');
    order.className = 'order';
    order.textContent = `${index + 1}.`;

    chip.appendChild(order);
    chip.appendChild(document.createTextNode(member.name));
    historyList.appendChild(chip);
  });
}

function playReel(finalMember, onDone) {
  let tickIndex = 0;

  function nextTick() {
    if (tickIndex >= TICK_DELAYS.length) {
      reelText.textContent = finalMember.name;
      reel.classList.add('landed');
      setTimeout(() => reel.classList.remove('landed'), 500);
      onDone();
      return;
    }

    const randomMember = allMembers[Math.floor(Math.random() * allMembers.length)];
    reelText.textContent = randomMember.name;

    const delay = TICK_DELAYS[tickIndex];
    tickIndex += 1;
    setTimeout(nextTick, delay);
  }

  nextTick();
}

function draw() {
  const pool = getPool();
  const finalMember = pool[Math.floor(Math.random() * pool.length)];

  drawBtn.disabled = true;

  playReel(finalMember, () => {
    drawnIds.push(finalMember.id);
    renderHistory();
    drawBtn.disabled = false;
  });
}

drawBtn.addEventListener('click', draw);

resetBtn.addEventListener('click', () => {
  drawnIds = [];
  renderHistory();
  reelText.textContent = '按下面開始抽';
});
