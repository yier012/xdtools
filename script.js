// 首頁的招呼語,每次整理隨機換一句
const GREETINGS = [
  "早安，兒子們！",
  "欸欸今天...",
  "你沒屌",
  "爸爸的魔爪在你背後游移啦！",
];

document.getElementById("greeting").textContent =
  GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

// 生日倒數的預覽文字
// TODO: 之後生日資料串接完成(例如從 /api/birthdays 或 KV 讀取)後,
// 在這裡計算「離現在最近的生日是誰、還剩幾天」,取代下面的暫時文字。
// 範例:
// const nextBirthday = getNextBirthday(members);
// document.getElementById("birthday-preview").textContent =
//   `最近: ${nextBirthday.name} ${nextBirthday.daysLeft}天後`;
