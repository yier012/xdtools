module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { password } = req.body || {};

  if (password && password === process.env.ADMIN_PASSWORD) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: '密碼錯誤' });
  }
};
