async function loadMembers() {
  const res = await fetch('/api/members');
  const data = await res.json();
  return data.members || [];
}

// 算出距離下一次生日還有幾天(今天生日的話回傳 0)
function daysUntilNextBirthday(birthday) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [, month, day] = birthday.split('-').map(Number);

  let next = new Date(today.getFullYear(), month - 1, day);
  next.setHours(0, 0, 0, 0);

  if (next < today) {
    next = new Date(today.getFullYear() + 1, month - 1, day);
  }

  const diffMs = next - today;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatBirthday(birthday) {
  const [, month, day] = birthday.split('-');
  return `${Number(month)}/${Number(day)}`;
}

function buildMemberCard(member) {
  const card = document.createElement('div');
  card.className = 'member-card';

  const avatar = document.createElement('div');
  avatar.className = 'member-avatar';
  if (member.avatarUrl) {
    avatar.style.backgroundImage = `url("${member.avatarUrl}")`;
  } else {
    avatar.textContent = member.name ? member.name[0] : '?';
  }

  const info = document.createElement('div');
  info.className = 'member-info';

  const nameEl = document.createElement('div');
  nameEl.className = 'member-name';
  nameEl.textContent = member.name;

  const bdayEl = document.createElement('div');
  bdayEl.className = 'member-bday';
  bdayEl.textContent = formatBirthday(member.birthday);

  info.appendChild(nameEl);
  info.appendChild(bdayEl);

  const countdown = document.createElement('div');
  countdown.className = 'member-countdown';
  if (member.daysLeft === 0) {
    countdown.classList.add('today');
    countdown.textContent = '今天！';
  } else {
    countdown.innerHTML =
      `<span class="num">${member.daysLeft}</span><span class="unit">天後</span>`;
  }

  card.appendChild(avatar);
  card.appendChild(info);
  card.appendChild(countdown);

  return card;
}

function renderMembers(members) {
  const list = document.getElementById('member-list');
  const loadingText = document.getElementById('loading-text');
  loadingText.style.display = 'none';

  const withDays = members
    .map((member) => ({ ...member, daysLeft: daysUntilNextBirthday(member.birthday) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  list.innerHTML = '';
  withDays.forEach((member) => list.appendChild(buildMemberCard(member)));
}

loadMembers()
  .then(renderMembers)
  .catch(() => {
    document.getElementById('loading-text').textContent = '讀取失敗,重新整理看看';
  });
