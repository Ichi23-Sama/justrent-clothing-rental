const pool = require('../config/db');

exports.listCategories = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT category_id, category_name
             FROM category
             ORDER BY category_name`
        );

        res.json(rows);
    } catch (error) {
        console.error('Could not load categories:', error.code);

        res.status(500).json({
            error: 'Unable to load categories. Please try again.'
        });
    }
};
