USE just_rent;

DELIMITER //

CREATE TRIGGER before_rental_item_insert
BEFORE INSERT ON rental_item
FOR EACH ROW
BEGIN
    DECLARE rental_status VARCHAR(20);

    SELECT status INTO rental_status
    FROM rental
    WHERE rental_id = NEW.rental_id;

    IF rental_status IS NULL OR rental_status <> 'Reserved' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Garments can only be added to a Reserved rental.';
    END IF;
END //

DELIMITER ;

USE just_rent;

INSERT INTO rental_item (
    rental_id,
    clothing_id,
    agreed_daily_rate
)
VALUES (1, 2, 300.00);


ALTER TABLE just_rent.clothing
ADD COLUMN stock_quantity INT NOT NULL DEFAULT 1,
ADD CONSTRAINT chk_clothing_stock
    CHECK (stock_quantity >= 1);
