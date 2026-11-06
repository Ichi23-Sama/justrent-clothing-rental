USE just_rent;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('User', 'Admin', 'Developer') NOT NULL DEFAULT 'User'
);

SELECT user_id, name, email, password_hash, role
FROM just_rent.users;

UPDATE just_rent.users
SET role = 'Admin'
WHERE user_id = 2;

SELECT user_id, name, email, role
FROM just_rent.users
WHERE user_id = 2;


SELECT user_id, name, email, role
FROM just_rent.users
WHERE email = 'dev@example.com';

UPDATE just_rent.users
SET role = 'Developer'
WHERE user_id = 3;

UPDATE just_rent.users
SET role = 'Admin'
WHERE user_id = 5;