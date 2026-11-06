const pool = require('../config/db');

exports.listRentals = async (req, res) => {
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Please log in first.' });
    }

    try {
        const canManage = ['Admin', 'Developer'].includes(user.role);

        let sql = `
            SELECT
                r.rental_id,
                u.name AS customer_name,
                r.start_date,
                r.due_date,
                r.status,

                (
                    SELECT GROUP_CONCAT(
                        DISTINCT c.clothing_name
                        ORDER BY c.clothing_name
                        SEPARATOR ', '
                    )
                    FROM rental_item AS ri
                    JOIN clothing AS c
                        ON c.clothing_id = ri.clothing_id
                    WHERE ri.rental_id = r.rental_id
                ) AS clothing_names,

                (
                    SELECT MAX(DATE_FORMAT(ri.returned_at, '%Y-%m-%d'))
                    FROM rental_item AS ri
                    WHERE ri.rental_id = r.rental_id
                ) AS returned_date,

                (
                    SELECT COALESCE(SUM(ri.agreed_daily_rate), 0)
                    FROM rental_item AS ri
                    WHERE ri.rental_id = r.rental_id
                ) * (DATEDIFF(r.due_date, r.start_date) + 1)
                    AS total_charge,

                (
                    SELECT COALESCE(SUM(p.amount), 0)
                    FROM payment AS p
                    WHERE p.rental_id = r.rental_id
                ) AS amount_paid,

                (
                    SELECT COALESCE(SUM(ri.agreed_daily_rate), 0)
                    FROM rental_item AS ri
                    WHERE ri.rental_id = r.rental_id
                ) * (DATEDIFF(r.due_date, r.start_date) + 1)
                - (
                    SELECT COALESCE(SUM(p.amount), 0)
                    FROM payment AS p
                    WHERE p.rental_id = r.rental_id
                ) AS balance

            FROM rental AS r
            JOIN users AS u ON u.user_id = r.user_id
        `;

        const parameters = [];

        if (!canManage) {
            sql += ' WHERE r.user_id = ?';
            parameters.push(user.user_id);
        }

        sql += ' ORDER BY r.rental_id DESC';

        const [rows] = await pool.execute(sql, parameters);
        res.json(rows);
    } catch (error) {
        console.error('Could not load rentals:', error.code);
        res.status(500).json({
            error: 'Unable to load rentals. Please try again.'
        });
    }
};

exports.createRental = async (req, res) => {
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({
            error: 'Please log in first.'
        });
    }

    const { clothing_id, start_date, due_date } = req.body;
    const clothingId = Number(clothing_id);

    // Check that a date is real and uses YYYY-MM-DD.
    function validDate(value) {
        if (
            typeof value !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
            return false;
        }

        const date = new Date(`${value}T00:00:00Z`);

        return Number.isFinite(date.getTime()) &&
            date.toISOString().slice(0, 10) === value;
    }

    if (
        !Number.isSafeInteger(clothingId) || clothingId <= 0 ||
        !validDate(start_date) || !validDate(due_date) ||
        due_date < start_date
    ) {
        return res.status(400).json({
            error: 'Choose clothing and valid dates. Due date cannot be before start date.'
        });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Lock this garment while checking and saving the booking.
        const [clothes] = await connection.execute(
            `SELECT clothing_id, daily_rate
             FROM clothing
             WHERE clothing_id = ?
             FOR UPDATE`,
            [clothingId]
        );

        if (clothes.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                error: 'Clothing item not found.'
            });
        }

        // Both start and due dates count as booked days.
        const [conflicts] = await connection.execute(
            `SELECT ri.rental_item_id
             FROM rental_item AS ri
             JOIN rental AS r ON ri.rental_id = r.rental_id
             WHERE ri.clothing_id = ?
               AND r.status IN ('Reserved', 'Active')
               AND r.start_date <= ?
               AND r.due_date >= ?
             LIMIT 1
             FOR UPDATE`,
            [clothingId, due_date, start_date]
        );

        if (conflicts.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                error: 'This garment is already booked for those dates.'
            });
        }

        const [rental] = await connection.execute(
            `INSERT INTO rental (user_id, start_date, due_date)
             VALUES (?, ?, ?)`,
            [user.user_id, start_date, due_date]
        );

        await connection.execute(
            `INSERT INTO rental_item
                (rental_id, clothing_id, agreed_daily_rate)
             VALUES (?, ?, ?)`,
            [rental.insertId, clothingId, clothes[0].daily_rate]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Rental created successfully.',
            rental_id: rental.insertId
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rental rollback failed:', rollbackError.code);
            }
        }

        console.error('Could not create rental:', error.code);

        res.status(500).json({
            error: 'Unable to create rental. Please try again.'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

exports.recordPickup = async (req, res) => {
    const rentalId = Number(req.params.id);
    const staffUserId = req.session.user.user_id;

    if (!Number.isSafeInteger(rentalId) || rentalId <= 0) {
        return res.status(400).json({ error: 'Invalid rental ID.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
            `UPDATE rental
             SET status = 'Active'
             WHERE rental_id = ? AND status = 'Reserved'`,
            [rentalId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(409).json({
                error: 'Rental not found or no longer Reserved.'
            });
        }

        await connection.execute(
            `UPDATE rental_item
             SET picked_up_at = NOW(), picked_up_by_user_id = ?
             WHERE rental_id = ?`,
            [staffUserId, rentalId]
        );

        await connection.commit();
        res.json({ message: 'Pickup recorded. Rental is now Active.' });
    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (rollbackError) {
                console.error('Pickup rollback failed:', rollbackError.code);
            }
        }
        console.error('Could not record pickup:', error.code);
        res.status(500).json({ error: 'Unable to record pickup. Please try again.' });
    } finally {
        if (connection) connection.release();
    }
};

exports.recordReturn = async (req, res) => {
        const rentalId = Number(req.params.id);

        if (!Number.isSafeInteger(rentalId) || rentalId <= 0) {
            return res.status(400).json({
                error: 'Invalid rental ID.'
            });
        }

        let connection;

        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const [rentals] = await connection.execute(
                `SELECT status
                 FROM rental
                 WHERE rental_id = ?
                 FOR UPDATE`,
                [rentalId]
            );

            if (
                rentals.length === 0 ||
                rentals[0].status !== 'Active'
            ) {
                await connection.rollback();

                return res.status(409).json({
                    error: 'Rental not found or not Active.'
                });
            }

            // Record the return of all garments in this rental.
            await connection.execute(
                `UPDATE rental_item
                SET returned_at = NOW(), returned_by_user_id = ?
                WHERE rental_id = ?
                AND returned_at IS NULL`,
                [req.session.user.user_id, rentalId]
            );

            await connection.execute(
                `UPDATE rental
                 SET status = 'Completed'
                 WHERE rental_id = ?`,
                [rentalId]
            );

            await connection.commit();

            res.json({
                message: 'Return recorded. Rental is now Completed.'
            });
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        'Return rollback failed:',
                        rollbackError.code
                    );
                }
            }

            console.error('Could not record return:', error.code);

            res.status(500).json({
                error: 'Unable to record return. Please try again.'
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    };

exports.listRentalActivity = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM (
                SELECT
                    'PICKUP' AS action,
                    r.rental_id,
                    ri.clothing_id,
                    c.clothing_name,
                    customer.name AS customer_name,
                    staff.name AS staff_name,
                    staff.role AS staff_role,
                    ri.picked_up_at AS performed_at
                FROM rental_item AS ri
                JOIN rental AS r ON r.rental_id = ri.rental_id
                JOIN users AS customer ON customer.user_id = r.user_id
                JOIN users AS staff ON staff.user_id = ri.picked_up_by_user_id
                JOIN clothing AS c ON c.clothing_id = ri.clothing_id
                WHERE ri.picked_up_at IS NOT NULL

                UNION ALL

                SELECT
                    'RETURN' AS action,
                    r.rental_id,
                    ri.clothing_id,
                    c.clothing_name,
                    customer.name AS customer_name,
                    staff.name AS staff_name,
                    staff.role AS staff_role,
                    ri.returned_at AS performed_at
                FROM rental_item AS ri
                JOIN rental AS r ON r.rental_id = ri.rental_id
                JOIN users AS customer ON customer.user_id = r.user_id
                JOIN users AS staff ON staff.user_id = ri.returned_by_user_id
                JOIN clothing AS c ON c.clothing_id = ri.clothing_id
                WHERE ri.returned_at IS NOT NULL
                  AND ri.returned_by_user_id IS NOT NULL
            ) AS activity
            ORDER BY performed_at DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Could not load rental activity:', error.code);
        res.status(500).json({ error: 'Unable to load rental activity. Please try again.' });
    }
};

exports.getSummary = async (req, res) => {
    const user = req.session.user;
    const rentalId = Number(req.params.id);

    if (!user) {
        return res.status(401).json({
            error: 'Please log in first.'
        });
    }

    if (!Number.isSafeInteger(rentalId) || rentalId <= 0) {
        return res.status(400).json({
            error: 'Invalid rental ID.'
        });
    }

    try {
        const canManage = ['Admin', 'Developer'].includes(user.role);

        // Users may view only their own rental summaries.
        const [rentals] = await pool.execute(
            `SELECT rental_id
             FROM rental
             WHERE rental_id = ?
             ${canManage ? '' : 'AND user_id = ?'}`,
            canManage
                ? [rentalId]
                : [rentalId, user.user_id]
        );

        if (rentals.length === 0) {
            return res.status(404).json({
                error: 'Rental not found.'
            });
        }

        const [results] = await pool.execute(
            'CALL get_rental_summary(?)',
            [rentalId]
        );

        res.json(results[0][0]);
    } catch (error) {
        console.error('Could not load rental summary:', error.code);

        res.status(500).json({
            error: 'Unable to load rental summary. Please try again.'
        });
    }
};
