-- Run once after the JustRent schema has been created.
-- Adds account deactivation and staff pickup/return attribution.

ALTER TABLE users
    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role;

ALTER TABLE rental_item
    ADD COLUMN picked_up_at DATETIME NULL AFTER agreed_daily_rate,
    ADD COLUMN picked_up_by_user_id INT NULL AFTER picked_up_at,
    ADD COLUMN returned_by_user_id INT NULL AFTER returned_at,
    ADD CONSTRAINT fk_rental_item_pickup_user
        FOREIGN KEY (picked_up_by_user_id) REFERENCES users(user_id),
    ADD CONSTRAINT fk_rental_item_return_user
        FOREIGN KEY (returned_by_user_id) REFERENCES users(user_id);
