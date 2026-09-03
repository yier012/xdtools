// ============================================
// 這裡是唯一需要手動修改的地方,改成你們真實的名字就好(要跟後台裡的暱稱完全一樣)
// ============================================

// 1號車、2號車的駕駛,固定不變
const DRIVER_A_NAME = '阿翔';
const DRIVER_B_NAME = '阿凱';

// 這兩人不能同一台車(例如已分手的情侶)
const NOT_TOGETHER = ['小玉', '珊珊'];

// 這兩人一定要同一台車(不管分到哪一台,反正要一起)
const MUST_TOGETHER = ['柏廷', '小魚'];

// ============================================

const loadingText = document.getElementById('loading-text');
const carsView = document.getElementById('cars-view');
const setupError = document.getElementById('setup-error');
const driverANameEl = document.getElementById('driver-a-name');
const driverBNameEl = document.getElementById('driver-b-name');
const carAPassengersEl = document.getElementById('car-a-passengers');
const carBPassengersEl = document.getElementById('car-b-passengers');
const splitBtn = document.getElementById('split-btn');

let driverA = null;
let driverB = null;
let passengers = [];

fetch('/api/members')
  .then((res) => res.json())
  .then((data) => {
    const members = data.members || [];

    driverA = members.find((m) => m.name === DRIVER_A_NAME);
    driverB = members.find((m) => m.name === DRIVER_B_NAME);

    if (!driverA || !driverB) {
      loadingText.textContent =
        '找不到指定的駕駛,檢查一下 car-split.js 裡 DRIVER_A_NAME / DRIVER_B_NAME 的名字有沒有跟後台的暱稱完全一樣';
      return;
    }

    passengers = members.filter(
      (m) => m.id !== driverA.id && m.id !== driverB.id
    );

    loadingText.style.display = 'none';
    carsView.hidden = false;
    driverANameEl.textContent = driverA.name;
    driverBNameEl.textContent = driverB.name;
  })
  .catch(() => {
    loadingText.textContent = '讀取失敗,重新整理看看';
  });

function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function splitPassengers() {
  const carA = [];
  const carB = [];
  let pool = passengers.slice();

  // 一定要同車的那兩人:一起丟進隨機選到的一台車
  const [mustName1, mustName2] = MUST_TOGETHER;
  const mustMember1 = pool.find((m) => m.name === mustName1);
  const mustMember2 = pool.find((m) => m.name === mustName2);
  if (mustMember1 && mustMember2) {
    pool = pool.filter(
      (m) => m.id !== mustMember1.id && m.id !== mustMember2.id
    );
    const targetCar = Math.random() < 0.5 ? carA : carB;
    targetCar.push(mustMember1, mustMember2);
  }

  // 不能同車的那兩人:硬拆到不同台車
  const [notName1, notName2] = NOT_TOGETHER;
  const notMember1 = pool.find((m) => m.name === notName1);
  const notMember2 = pool.find((m) => m.name === notName2);
  if (notMember1 && notMember2) {
    pool = pool.filter(
      (m) => m.id !== notMember1.id && m.id !== notMember2.id
    );
    if (Math.random() < 0.5) {
      carA.push(notMember1);
      carB.push(notMember2);
    } else {
      carA.push(notMember2);
      carB.push(notMember1);
    }
  }

  // 剩下的人隨機分配,盡量平均
  shuffle(pool).forEach((member) => {
    if (carA.length <= carB.length) {
      carA.push(member);
    } else {
      carB.push(member);
    }
  });

  return { carA, carB };
}

function renderPassengerList(container, members) {
  container.innerHTML = '';
  members.forEach((member) => {
    const row = document.createElement('div');
    row.textContent = member.name;
    container.appendChild(row);
  });
}

function runSplit() {
  setupError.textContent = '';
  const { carA, carB } = splitPassengers();
  renderPassengerList(carAPassengersEl, carA);
  renderPassengerList(carBPassengersEl, carB);
  splitBtn.textContent = '再抽一次';
}

splitBtn.addEventListener('click', runSplit);
