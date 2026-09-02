const { kv } = require('@vercel/kv');

// 預設的假資料,你可以直接在後台把這些改成真的團員
const DEFAULT_MEMBERS = [
  { id: 'm1', name: '阿翔', birthday: '1996-09-14', avatarUrl: '' },
  { id: 'm2', name: '小玉', birthday: '1997-01-22', avatarUrl: '' },
  { id: 'm3', name: '阿凱', birthday: '1995-11-03', avatarUrl: '' },
  { id: 'm4', name: '珊珊', birthday: '1998-03-30', avatarUrl: '' },
  { id: 'm5', name: '柏廷', birthday: '1996-06-18', avatarUrl: '' },
  { id: 'm6', name: '小魚', birthday: '1997-12-25', avatarUrl: '' },
  { id: 'm7', name: '阿德', birthday: '1994-08-07', avatarUrl: '' },
  { id: 'm8', name: '雨萱', birthday: '1998-04-11', avatarUrl: '' },
  { id: 'm9', name: '阿哲', birthday: '1996-02-28', avatarUrl: '' },
  { id: 'm10', name: '小惟', birthday: '1997-10-09', avatarUrl: '' },
];

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    let members = await kv.get('members');
    if (!members) {
      members = DEFAULT_MEMBERS;
      await kv.set('members', members);
    }
    res.status(200).json({ members });
    return;
  }

  if (req.method === 'POST') {
    const { password, members } = req.body || {};

    if (password !== process.env.ADMIN_PASSWORD) {
      res.status(401).json({ error: '密碼錯誤' });
      return;
    }
    if (!Array.isArray(members)) {
      res.status(400).json({ error: '資料格式錯誤' });
      return;
    }

    await kv.set('members', members);
    res.status(200).json({ members });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
