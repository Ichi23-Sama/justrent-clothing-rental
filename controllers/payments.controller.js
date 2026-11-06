const pool = require('../config/db');

exports.createPayment = async (req, res) => {
    const { rental_id, amount, method } = req.body;
    const rentalId = Number(rental_id);

    // Validate money as text, then convert to whole satang.
    const amountText = String(amount ?? '').trim();

    if (
        !Number.isSafeInteger(rentalId) || rentalId <= 0 ||
        !/^\d{1,8}(\.\d{1,2})?$/.test(amountText) ||
        !['Cash', 'Transfer', 'Card'].includes(method)
    ) {
        return res.status(400).json({
            error: 'Enter a valid rental ID, amount, and payment method.'
        });
    }

    const amountSatang = Math.round(Number(amountText) * 100);

    if (amountSatang <= 0) {
        return res.status(400).json({
            error: 'Payment amount must be greater than zero.'
        });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Process payments for this rental one at a time.
        const [rentals] = await connection.execute(
            `SELECT status FROM rental
             WHERE rental_id = ?
             FOR UPDATE`,
            [rentalId]
        );

        if (rentals.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                error: 'Rental not found.'
            });
        }

        if (rentals[0].status === 'Canceled') {
            await connection.rollback();

            return res.status(409).json({
                error: 'Cannot record payment for a canceled rental.'
            });
        }

        const [results] = await connection.execute(
            'CALL get_rental_summary(?)',
            [rentalId]
        );

        const summary = results[0][0];
        const balanceSatang =
            Math.round(Number(summary.balance) * 100);

        if (amountSatang > balanceSatang) {
            await connection.rollback();

            return res.status(409).json({
                error: 'Payment cannot exceed the remaining balance.'
            });
        }

        await connection.execute(
            `INSERT INTO payment (rental_id, amount, method)
             VALUES (?, ?, ?)`,
            [rentalId, (amountSatang / 100).toFixed(2), method]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Payment recorded successfully.'
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    'Payment rollback failed:',
                    rollbackError.code
                );
            }
        }

        console.error('Could not record payment:', error.code);

        res.status(500).json({
            error: 'Unable to record payment. Please try again.'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
