const dotenv = require('dotenv');
dotenv.config();

// POST /api/auth/login
exports.login = (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password !== adminPassword) {
        console.warn('[AUTH] Failed login attempt');
        return res.status(401).json({ error: 'Invalid password' });
    }

    console.log('[AUTH] Successful login');
    res.json({ ok: true, message: 'Login successful' });
};
