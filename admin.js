const state = {
  password: null,
  members: [],
};

const loginView = document.getElementById('login-view');
const editorView = document.getElementById('editor-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const passwordInput = document.getElementById('password-input');
const memberEditList = document.getElementById('member-edit-list');
const addBtn = document.getElementById('add-member-btn');
const saveBtn = document.getElementById('save-btn');
const saveStatus = document.getElementById('save-status');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';

  const password = passwordInput.value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    loginError.textContent = '密碼錯誤,再試一次';
    return;
  }

  state.password = password;
  // 存在 sessionStorage 只是方便重新整理後不用重打一次密碼欄位,
  // 分頁關掉就會清掉,不是長期保存的登入狀態。
  sessionStorage.setItem('xd-admin-password', password);
  await enterEditor();
});

async function enterEditor() {
  loginView.hidden = true;
  editorView.hidden = false;

  const res = await fetch('/api/members');
  const data = await res.json();
  state.members = data.members || [];
  renderEditList();
}

function renderEditList() {
  memberEditList.innerHTML = '';
  state.members.forEach((member, index) => {
    memberEditList.appendChild(buildMemberRow(member, index));
  });
}

function buildMemberRow(member, index) {
  const row = document.createElement('div');
  row.className = 'edit-row';

  const avatarInput = document.createElement('input');
  avatarInput.type = 'text';
  avatarInput.placeholder = '頭貼網址(選填)';
  avatarInput.value = member.avatarUrl || '';
  avatarInput.addEventListener('input', (e) => {
    state.members[index].avatarUrl = e.target.value;
  });

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = '暱稱';
  nameInput.value = member.name || '';
  nameInput.addEventListener('input', (e) => {
    state.members[index].name = e.target.value;
  });

  const birthdayInput = document.createElement('input');
  birthdayInput.type = 'date';
  birthdayInput.value = member.birthday || '';
  birthdayInput.addEventListener('input', (e) => {
    state.members[index].birthday = e.target.value;
  });

  const driveInput = document.createElement('input');
  driveInput.type = 'checkbox';
  driveInput.className = 'field-drive';
  driveInput.checked = Boolean(member.canDrive);
  driveInput.addEventListener('change', (e) => {
    state.members[index].canDrive = e.target.checked;
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '刪除';
  deleteBtn.addEventListener('click', () => {
    state.members.splice(index, 1);
    renderEditList();
  });

  row.appendChild(avatarInput);
  row.appendChild(nameInput);
  row.appendChild(birthdayInput);
  row.appendChild(driveInput);
  row.appendChild(deleteBtn);

  return row;
}

addBtn.addEventListener('click', () => {
  state.members.push({
    id: `m-${Date.now()}`,
    name: '新成員',
    birthday: '2000-01-01',
    avatarUrl: '',
    canDrive: false,
  });
  renderEditList();
});

saveBtn.addEventListener('click', async () => {
  saveStatus.textContent = '儲存中...';

  const res = await fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: state.password, members: state.members }),
  });

  if (!res.ok) {
    saveStatus.textContent = '儲存失敗,重新整理再登入一次試試';
    return;
  }

  saveStatus.textContent = '已儲存';
  setTimeout(() => {
    saveStatus.textContent = '';
  }, 2000);
});

// 如果同一個分頁重新整理過,幫忙把密碼欄位帶回來(不會自動送出)
const savedPassword = sessionStorage.getItem('xd-admin-password');
if (savedPassword) {
  passwordInput.value = savedPassword;
}
