const pool = require('../config/db');

async function requireActiveAccount(req, res, next) {
    if (!req.session.user) return next();

    try {
        const [rows] = await pool.execute(
            'SELECT is_active FROM users WHERE user_id = ?',
            [req.session.user.user_id]
        );

        if (!rows.length || !rows[0].is_active) {
            return req.session.destroy(() => {
                res.status(401).json({ error: 'This account is inactive. Please contact a Developer.' });
            });
        }

        next();
    } catch (error) {
        console.error('Could not verify account status:', error.code);
        res.status(500).json({ error: 'Unable to verify account status. Please try again.' });
    }
}

module.exports = requireActiveAccount;
