USE just_rent;

-- Create the category table.
CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

-- Add three categories.
INSERT INTO category (category_name)
VALUES ('Dresses'), ('Suits'), ('Shirts');

-- Add a category reference to clothing.
ALTER TABLE clothing
ADD COLUMN category_id INT NULL,
ADD CONSTRAINT fk_clothing_category
    FOREIGN KEY (category_id)
    REFERENCES category(category_id);
    
    UPDATE clothing
SET category_id = (
    SELECT category_id FROM category
    WHERE category_name = 'Dresses'
)
WHERE clothing_name IN ('Blue Dress', 'Pink Dress');

UPDATE clothing
SET category_id = (
    SELECT category_id FROM category
    WHERE category_name = 'Suits'
)
WHERE clothing_name = 'Black Suit';

UPDATE clothing
SET category_id = (
    SELECT category_id FROM category
    WHERE category_name = 'Shirts'
)
WHERE clothing_name = 'White Shirt';

SELECT
    clothing.clothing_id,
    clothing.clothing_name,
    clothing.size,
    clothing.daily_rate,
    category.category_name
FROM clothing
LEFT JOIN category
    ON clothing.category_id = category.category_id
ORDER BY clothing.clothing_id;




USE just_rent;

UPDATE clothing
SET category_id = (
    SELECT category_id
    FROM category
    WHERE category_name = 'Dresses'
)
WHERE clothing_id IN (1, 4);

UPDATE clothing
SET category_id = (
    SELECT category_id
    FROM category
    WHERE category_name = 'Suits'
)
WHERE clothing_id = 2;

USE just_rent;

SELECT category_id, category_name
FROM category;

SELECT clothing_id, clothing_name, category_id
FROM clothing
ORDER BY clothing_id;

SELECT category_id, category_name
FROM just_rent.category;



UPDATE just_rent.clothing
SET category_id = 1
WHERE clothing_id IN (1, 4);

UPDATE just_rent.clothing
SET category_id = 2
WHERE clothing_id = 2;

SELECT clothing_id, clothing_name, category_id
FROM just_rent.clothing
ORDER BY clothing_id;

USE just_rent;
INSERT INTO category (category_name)
VALUES ('Pants'),('Others');