// 首頁的招呼語,每次整理隨機換一句
const GREETINGS = [
  "嗨,今天想整誰?",
  "團員們,今天想幹嘛?",
  "打開工具箱,開始搞事",
  "欸欸欸,又是你",
];

document.getElementById("greeting").textContent =
  GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

// 生日倒數的預覽文字:抓最近的一位壽星顯示在首頁卡片上
function daysUntilNextBirthday(birthday) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [, month, day] = birthday.split("-").map(Number);
  let next = new Date(today.getFullYear(), month - 1, day);
  next.setHours(0, 0, 0, 0);
  if (next < today) {
    next = new Date(today.getFullYear() + 1, month - 1, day);
  }
  return Math.round((next - today) / (1000 * 60 * 60 * 24));
}

fetch("/api/members")
  .then((res) => res.json())
  .then((data) => {
    const members = data.members || [];
    if (members.length === 0) return;

    const withDays = members
      .map((m) => ({ ...m, daysLeft: daysUntilNextBirthday(m.birthday) }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const nearest = withDays[0];
    const text = nearest.daysLeft === 0
      ? `今天是 ${nearest.name} 的生日！`
      : `最近: ${nearest.name} ${nearest.daysLeft}天後`;

    document.getElementById("birthday-preview").textContent = text;
  })
  .catch(() => {
    // API 還沒部署好之前,首頁就先維持預設文字,不影響其他功能
  });
