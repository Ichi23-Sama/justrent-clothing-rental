const pool = require('../config/db');

exports.listClothing = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT
    c.clothing_id,
    c.clothing_name,
    c.size,
    c.daily_rate,
    c.image_path,
    c.category_id,
    cat.category_name,
    EXISTS (
        SELECT 1
        FROM rental_item AS ri
        JOIN rental AS r ON ri.rental_id = r.rental_id
        WHERE ri.clothing_id = c.clothing_id
          AND r.status = 'Active'
          AND ri.returned_at IS NULL
    ) AS is_rented
FROM clothing AS c
LEFT JOIN category AS cat
    ON c.category_id = cat.category_id
    WHERE c.is_active = TRUE
ORDER BY c.clothing_id`
        );

        res.json(rows);
    } catch (error) {
        console.error('Could not load clothing:', error.code);

        res.status(500).json({
            error: 'Unable to load clothing. Please try again.'
        });
    }
};

exports.createClothing = async (req, res) => {
    const {
    clothing_name, size, daily_rate, category_id, image_path
} = req.body;

const imagePath = typeof image_path === 'string'
    ? image_path.trim()
    : '';

if (
    imagePath &&
    !/^\/images\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/i.test(imagePath)
) {
    return res.status(400).json({
        error: 'Use a path such as /images/blue-dress.jpg, with no spaces.'
    });
}

    const name = typeof clothing_name === 'string'
        ? clothing_name.trim() : '';

    const clothingSize = typeof size === 'string'
        ? size.trim() : '';

    const rate = Number(daily_rate);
    const categoryId = Number(category_id);

    if (
        !name || name.length > 100 ||
        !clothingSize || clothingSize.length > 10 ||
        daily_rate === '' || daily_rate == null ||
        !Number.isFinite(rate) || rate < 0 || rate > 99999999.99 ||
        !Number.isSafeInteger(categoryId) || categoryId <= 0
    ) {
        return res.status(400).json({
            error: 'Enter a name, category, size, and valid nonnegative rate.'
        });
    }

    try {
        const [result] = await pool.execute(
    `INSERT INTO clothing
        (clothing_name, size, daily_rate, category_id, image_path)
     VALUES (?, ?, ?, ?, ?)`,
    [name, clothingSize, rate, categoryId, imagePath || null]
);

        res.status(201).json({
            message: 'Clothing added successfully.',
            clothing_id: result.insertId
        });
    } catch (error) {
        console.error('Could not add clothing:', error.code);

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                error: 'Choose an existing category.'
            });
        }

        res.status(500).json({
            error: 'Unable to add clothing. Please try again.'
        });
    }
};

exports.updateClothing = async (req, res) => {
    const id = Number(req.params.id);
    const {
    clothing_name, size, daily_rate, category_id, image_path
} = req.body;

const imagePath = typeof image_path === 'string'
    ? image_path.trim()
    : '';

if (
    imagePath &&
    !/^\/images\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/i.test(imagePath)
) {
    return res.status(400).json({
        error: 'Use a path such as /images/blue-dress.jpg, with no spaces.'
    });
}

    const name = typeof clothing_name === 'string'
        ? clothing_name.trim() : '';

    const clothingSize = typeof size === 'string'
        ? size.trim() : '';

    const rate = Number(daily_rate);
    const categoryId = Number(category_id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid clothing ID.'
        });
    }

    if (
        !name || name.length > 100 ||
        !clothingSize || clothingSize.length > 10 ||
        daily_rate === '' || daily_rate == null ||
        !Number.isFinite(rate) || rate < 0 || rate > 99999999.99 ||
        !Number.isSafeInteger(categoryId) || categoryId <= 0
    ) {
        return res.status(400).json({
            error: 'Enter a name, category, size, and valid nonnegative rate.'
        });
    }

    try {
        const [result] = await pool.execute(
    `UPDATE clothing
     SET clothing_name = ?, size = ?, daily_rate = ?,
         category_id = ?, image_path = ?
     WHERE clothing_id = ?`,
    [name, clothingSize, rate, categoryId, imagePath || null, id]
);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Clothing item not found.'
            });
        }

        res.json({
            message: 'Clothing updated successfully.'
        });
    } catch (error) {
        console.error('Could not update clothing:', error.code);

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                error: 'Choose an existing category.'
            });
        }

        res.status(500).json({
            error: 'Unable to update clothing. Please try again.'
        });
    }
};

exports.deleteClothing = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid clothing ID.' });
  }

  try {
    const [openRentals] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM rental_item AS ri
       JOIN rental AS r ON r.rental_id = ri.rental_id
       WHERE ri.clothing_id = ?
         AND r.status IN ('Reserved', 'Active')`,
      [id]
    );

    if (openRentals[0].count > 0) {
      return res.status(409).json({
        error: 'Cannot remove clothing while it has an open rental.'
      });
    }

    const [result] = await pool.execute(
      `UPDATE clothing
       SET is_active = FALSE
       WHERE clothing_id = ? AND is_active = TRUE`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Clothing item not found or already removed.'
      });
    }

    res.json({ message: 'Clothing removed from the catalog.' });
  } catch (error) {
    console.error('Could not remove clothing:', error.code);
    res.status(500).json({
      error: 'Unable to remove clothing. Please try again.'
    });
  }
};

