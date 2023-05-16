const express = require('express');
const router = require('./router');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const app = express();

const auth = require('./lib/auth');
const connectDB = require('./config/database-config');
const errorHandler = require('./middlewares/error-handler');

connectDB.ready.then(_ => {
    const { PORT, WEB_SERVER_URI, SESSION_SECRET } = process.env;

    // for parsing application/json
    app.use(bodyParser.json());
    // for parsing application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors({
        origin: '*',    // replaced with WEB_SERVER_URI
        credentials: true,
    }));
    // for parsing cookies
    app.use(cookieParser(SESSION_SECRET));

    // setup app session
    app.use(session({
        name: 'session',
        secret: SESSION_SECRET,
        // Forces the session to be saved back to the session store,
        // even if the session was never modified during the request
        resave: true,
        // Forces a session that is "uninitialized" to be saved to the store
        saveUninitialized: false,
        store: new MongoStore(connectDB.getMongoose().connection),
        duration: 7 * 24 * 60 * 60 * 1000, // how long the session will stay valid in ms (1 week)
        cookie: {
            path: '/',
            httpOnly: true,
            secure: false,
            ephemeral: true,    // cookie expires when the browser closes
            // Specifies the number to use when calculating the 'Expires''Set-Cookie' attribute in ms (1 week)
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    }));

    // Setup Authentication
    auth.configureMiddleware(app);
    // Set the router entry point
    app.use('/', router);
    // Setup Error Handler
    app.use(errorHandler);
    // Start the web server
    app.listen(3001, () => console.log(`Server is listening on http://localhost:3001`));
})
.catch(err => {
    console.log('Error occurred while connecting to Database', err);
})