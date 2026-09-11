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

  const avatarCell = document.createElement('div');
  avatarCell.className = 'avatar-cell';

  const avatarPreview = document.createElement('div');
  avatarPreview.className = 'avatar-preview';
  updateAvatarPreview(avatarPreview, member);

  const avatarFileInput = document.createElement('input');
  avatarFileInput.type = 'file';
  avatarFileInput.accept = 'image/*';
  avatarFileInput.className = 'avatar-file-input';
  avatarFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    openCropModal(file, (croppedDataUrl) => {
      state.members[index].avatarUrl = croppedDataUrl;
      updateAvatarPreview(avatarPreview, state.members[index]);
    });
    avatarFileInput.value = '';
  });

  avatarCell.appendChild(avatarPreview);
  avatarCell.appendChild(avatarFileInput);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'field-name';
  nameInput.placeholder = '暱稱';
  nameInput.value = member.name || '';
  nameInput.addEventListener('input', (e) => {
    state.members[index].name = e.target.value;
  });

  const birthdayInput = document.createElement('input');
  birthdayInput.type = 'date';
  birthdayInput.className = 'field-birthday';
  birthdayInput.value = member.birthday || '';
  birthdayInput.addEventListener('input', (e) => {
    state.members[index].birthday = e.target.value;
  });

  const roleSelect = document.createElement('select');
  roleSelect.className = 'field-role';
  const driverOption = document.createElement('option');
  driverOption.value = 'driver';
  driverOption.textContent = '駕駛';
  const passengerOption = document.createElement('option');
  passengerOption.value = 'passenger';
  passengerOption.textContent = '乘客';
  const notParticipatingOption = document.createElement('option');
  notParticipatingOption.value = 'not_participating';
  notParticipatingOption.textContent = '不參與抽車';
  roleSelect.appendChild(driverOption);
  roleSelect.appendChild(passengerOption);
  roleSelect.appendChild(notParticipatingOption);
  roleSelect.value = member.role || 'passenger';
  state.members[index].role = roleSelect.value;
  roleSelect.addEventListener('change', (e) => {
    state.members[index].role = e.target.value;
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '刪除';
  deleteBtn.addEventListener('click', () => {
    state.members.splice(index, 1);
    renderEditList();
  });

  row.appendChild(avatarCell);
  row.appendChild(nameInput);
  row.appendChild(birthdayInput);
  row.appendChild(roleSelect);
  row.appendChild(deleteBtn);

  return row;
}

function updateAvatarPreview(previewEl, member) {
  if (member.avatarUrl) {
    previewEl.style.backgroundImage = `url("${member.avatarUrl}")`;
    previewEl.textContent = '';
  } else {
    previewEl.style.backgroundImage = 'none';
    previewEl.textContent = member.name ? member.name[0] : '?';
  }
}

// 把選到的圖片縮小到最長邊不超過 maxSize,轉成 JPEG 的 base64 字串,
// 這樣才不會一張原圖幾 MB 直接塞進資料庫。
function resizeCanvasToDataUrl(canvas, maxSize) {
  let { width, height } = canvas;

  if (width > height && width > maxSize) {
    height = Math.round(height * (maxSize / width));
    width = maxSize;
  } else if (height >= width && height > maxSize) {
    width = Math.round(width * (maxSize / height));
    height = maxSize;
  }

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = width;
  resizedCanvas.height = height;
  resizedCanvas.getContext('2d').drawImage(canvas, 0, 0, width, height);

  return resizedCanvas.toDataURL('image/jpeg', 0.85);
}

// ---- 裁切彈窗 ----
const cropModal = document.getElementById('crop-modal');
const cropImage = document.getElementById('crop-image');
const cropCancelBtn = document.getElementById('crop-cancel-btn');
const cropConfirmBtn = document.getElementById('crop-confirm-btn');

let activeCropper = null;
let onCropDone = null;

function openCropModal(file, callback) {
  onCropDone = callback;

  const reader = new FileReader();
  reader.onload = (event) => {
    cropImage.src = event.target.result;
    cropModal.hidden = false;

    if (activeCropper) {
      activeCropper.destroy();
    }
    activeCropper = new Cropper(cropImage, {
      aspectRatio: 1,
      viewMode: 1,
      background: false,
      autoCropArea: 1,
    });
  };
  reader.readAsDataURL(file);
}

function closeCropModal() {
  cropModal.hidden = true;
  if (activeCropper) {
    activeCropper.destroy();
    activeCropper = null;
  }
  onCropDone = null;
}

cropCancelBtn.addEventListener('click', closeCropModal);

cropConfirmBtn.addEventListener('click', () => {
  if (!activeCropper || !onCropDone) return;

  const canvas = activeCropper.getCroppedCanvas({ width: 300, height: 300 });
  const dataUrl = resizeCanvasToDataUrl(canvas, 200);

  const callback = onCropDone;
  closeCropModal();
  callback(dataUrl);
});

addBtn.addEventListener('click', () => {
  state.members.push({
    id: `m-${Date.now()}`,
    name: '新成員',
    birthday: '2000-01-01',
    avatarUrl: '',
    role: 'passenger',
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
