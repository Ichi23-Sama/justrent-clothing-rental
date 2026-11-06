const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const imageFolder = path.join(__dirname, '..', 'public', 'images');

fs.mkdirSync(imageFolder, { recursive: true });

const allowedImages = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const upload = multer({
    storage: multer.diskStorage({
        destination: imageFolder,
        filename: (req, file, callback) => {
            const filename =
                crypto.randomUUID() + allowedImages[file.mimetype];

            callback(null, filename);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        if (!allowedImages[file.mimetype]) {
            return callback(
                new Error('Choose a JPG, PNG, or WebP picture.')
            );
        }

        callback(null, true);
    }
});

module.exports = upload;
