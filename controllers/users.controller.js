const pool = require('../config/db');

exports.listUsers = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT user_id, name, email, role, is_active
             FROM users
             ORDER BY user_id`
        );

        res.json(rows);
    } catch (error) {
        console.error('Could not load accounts:', error.code);

        res.status(500).json({
            error: 'Unable to load accounts. Please try again.'
        });
    }
};


exports.setUserActiveStatus = async (req, res) => {
    const targetUserId = Number(req.params.id);
    const actor = req.session.user;
    const { is_active } = req.body;

    if (!Number.isSafeInteger(targetUserId) || targetUserId <= 0 ||
        typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'Invalid account status request.' });
    }

    if (targetUserId === actor.user_id) {
        return res.status(409).json({ error: 'You cannot deactivate your own account.' });
    }

    try {
        const [result] = await pool.execute(
            `UPDATE users
             SET is_active = ?
             WHERE user_id = ? AND role IN ('User', 'Admin')`,
            [is_active, targetUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'User or Admin account not found.'
            });
        }

        res.json({
            message: is_active ? 'Account reactivated.' : 'Account deactivated.'
        });
    } catch (error) {
        console.error('Could not update account status:', error.code);
        res.status(500).json({ error: 'Unable to update account. Please try again.' });
    }
};
