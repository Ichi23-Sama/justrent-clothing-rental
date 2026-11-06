require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const authRouter = require('./routes/auth.routes');
const clothingRouter = require('./routes/clothing.routes');
const categoriesRouter = require('./routes/categories.routes');
const rentalsRouter = require('./routes/rentals.routes');
const paymentsRouter = require('./routes/payments.routes');
const usersRouter = require('./routes/users.routes');
const uploadRouter = require('./routes/upload.routes');
const requireActiveAccount = require('./middleware/requireActiveAccount');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 1000 * 60 * 60
    }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', requireActiveAccount);

app.use('/api', authRouter);
app.use('/api/clothing', clothingRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/rentals', rentalsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);

app.listen(PORT, () => {
    console.log(`JUST RENT is running at http://localhost:${PORT}`);
});
