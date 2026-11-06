USE just_rent;

DELIMITER //

CREATE PROCEDURE get_rental_summary(IN p_rental_id INT)
BEGIN
    SELECT
        r.rental_id,
        DATEDIFF(r.due_date, r.start_date) + 1 AS rental_days,

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
    WHERE r.rental_id = p_rental_id;
END //

DELIMITER ;

CALL get_rental_summary(1);