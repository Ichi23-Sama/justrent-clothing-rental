CREATE DATABASE IF NOT EXISTS just_rent;

USE just_rent;

CREATE TABLE IF NOT EXISTS clothing (
    clothing_id INT AUTO_INCREMENT PRIMARY KEY,
    clothing_name VARCHAR(100) NOT NULL,
    size VARCHAR(10) NOT NULL,
    daily_rate DECIMAL(10, 2) NOT NULL
);

INSERT INTO clothing (clothing_name, size, daily_rate)
VALUES
    ('Blue Dress', 'M', 150.00),
    ('Black Suit', 'L', 300.00),
    ('White Shirt', 'S', 100.00);
    
USE just_rent;
SELECT * FROM clothing;

SHOW COLUMNS FROM just_rent.clothing LIKE 'image_path';

ALTER TABLE just_rent.clothing
ADD COLUMN image_path VARCHAR(255) NULL;

UPDATE just_rent.clothing
SET image_path = '/images/image.png'
WHERE clothing_id = 1;

SELECT clothing_id, clothing_name, image_path
FROM just_rent.clothing
WHERE clothing_id = 1;