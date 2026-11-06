const upload = require('../config/upload');

exports.uploadPhoto = (req, res) => {
    upload.single('photo')(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                error: error.code === 'LIMIT_FILE_SIZE'
                    ? 'Picture must be 5 MB or smaller.'
                    : 'Upload failed. Choose one JPG, PNG, or WebP picture.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: 'Please choose a picture.'
            });
        }

        res.status(201).json({
            image_path: `/images/${req.file.filename}`
        });
    });
};
