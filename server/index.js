require('dotenv').config();
const express = require('express');
const router = require('./router');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const auth = require('./auth');

const app = express();
const connectDB = require('./config/database-config');

connectDB.then(_ => {
    PORT = process.env.PORT || 3001;

    // app.use(bodyParser.json());
    app.use((req, res, next) => {
        if(req.originalUrl === '/stripe-webhooks') 
            bodyParser.raw({ type: 'application/json' })(req, res, next);
        else
            bodyParser.json()(req,res,next);
    });
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors({
        origin: '*',
        credentials: true,
    }));
    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    }));

    app.use(cookieParser(process.env.SESSION_SECRET));

    auth.configureMiddleware(app);

    app.use('/', router);
    app.listen(PORT, () => console.log(`Server is listening on http://localhost:${PORT}`));
})
.catch(err => {
    console.log('Error occurred while connecting to Database', err);
})