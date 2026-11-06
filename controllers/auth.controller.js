const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    const cleanName = typeof name === 'string'
        ? name.trim() : '';

    const cleanEmail = typeof email === 'string'
        ? email.trim().toLowerCase() : '';

    if (
        !cleanName || cleanName.length > 100 ||
        !cleanEmail || cleanEmail.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
        typeof password !== 'string' ||
        password.length < 8 ||
        Buffer.byteLength(password, 'utf8') > 72
    ) {
        return res.status(400).json({
            error: 'Enter a name, valid email, and a password of at least 8 characters (maximum 72 bytes).'
        });
    }

    try {
        // Protect the password before saving it.
        const hash = await bcrypt.hash(password, 10);

        await pool.execute(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES (?, ?, ?, 'User')`,
            [cleanName, cleanEmail, hash]
        );

        res.status(201).json({
            message: 'Account created. You can now log in.'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'This email is already registered.'
            });
        }

        console.error('Registration failed:', error.code);

        res.status(500).json({
            error: 'Unable to create account. Please try again.'
        });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    const cleanEmail = typeof email === 'string'
        ? email.trim().toLowerCase()
        : '';

    if (
        !cleanEmail || cleanEmail.length > 150 ||
        typeof password !== 'string' || !password ||
        Buffer.byteLength(password, 'utf8') > 72
    ) {
        return res.status(400).json({
            error: 'Enter a valid email and password.'
        });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT user_id, name, email, password_hash, role, is_active
             FROM users
             WHERE email = ?`,
            [cleanEmail]
        );

        const user = rows[0];

        const validPassword = user && user.is_active
            ? await bcrypt.compare(password, user.password_hash)
            : false;

        if (!validPassword) {
            return res.status(401).json({
                error: 'Invalid email or password.'
            });
        }

        // Start a fresh session after successful login.
        req.session.regenerate((error) => {
            if (error) {
                console.error('Could not create login session.');

                return res.status(500).json({
                    error: 'Unable to log in. Please try again.'
                });
            }

            req.session.user = {
                user_id: user.user_id,
                name: user.name,
                role: user.role
            };

            req.session.save((error) => {
                if (error) {
                    console.error('Could not save login session.');

                    return res.status(500).json({
                        error: 'Unable to log in. Please try again.'
                    });
                }

                res.json({
                    message: 'Logged in successfully.',
                    user: req.session.user
                });
            });
        });
    } catch (error) {
        console.error('Login failed:', error.code);

        res.status(500).json({
            error: 'Unable to log in. Please try again.'
        });
    }
};

exports.currentUser = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            error: 'You are not logged in.'
        });
    }

    res.json({
        user: req.session.user
    });
};

exports.logout = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                error: 'Unable to log out. Please try again.'
            });
        }

        res.clearCookie('connect.sid', { path: '/' });

        res.json({
            message: 'Logged out successfully.'
        });
    });
};
