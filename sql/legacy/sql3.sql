USE just_rent;

CREATE TABLE rental (
    rental_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM(
        'Reserved',
        'Active',
        'Completed',
        'Canceled'
    ) NOT NULL DEFAULT 'Reserved',

    CONSTRAINT fk_rental_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT chk_rental_dates
        CHECK (due_date >= start_date)
);

USE just_rent;

CREATE TABLE rental_item (
    rental_item_id INT AUTO_INCREMENT PRIMARY KEY,
    rental_id INT NOT NULL,
    clothing_id INT NOT NULL,
    agreed_daily_rate DECIMAL(10, 2) NOT NULL,
    returned_at DATETIME NULL,

    CONSTRAINT fk_rental_item_rental
        FOREIGN KEY (rental_id)
        REFERENCES rental(rental_id),

    CONSTRAINT fk_rental_item_clothing
        FOREIGN KEY (clothing_id)
        REFERENCES clothing(clothing_id),

    CONSTRAINT uq_rental_clothing
        UNIQUE (rental_id, clothing_id),

    CONSTRAINT chk_agreed_daily_rate
        CHECK (agreed_daily_rate >= 0)
);

USE just_rent;

CREATE TABLE payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    rental_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method ENUM('Cash', 'Transfer', 'Card') NOT NULL,

    CONSTRAINT fk_payment_rental
        FOREIGN KEY (rental_id)
        REFERENCES rental(rental_id),

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0)
);

SHOW TABLES FROM just_rent;