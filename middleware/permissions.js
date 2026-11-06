function requireClothingManager(req, res, next) {
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: 'Please log in first.' });
    if (!['Admin', 'Developer'].includes(user.role)) {
        return res.status(403).json({ error: 'Only Admin and Developer can manage clothing.' });
    }
    next();
}

function requireDeveloper(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'Please log in first.' });
    if (req.session.user.role !== 'Developer') {
        return res.status(403).json({ error: 'Only Developer can access account management.' });
    }
    next();
}

module.exports = { requireClothingManager, requireDeveloper };
