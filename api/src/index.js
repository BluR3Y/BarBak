const express = require('express');
const router = require('./router');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const connectDB = require('./config/database-config');

connectDB.then(_ => {
    const { PORT, WEB_SERVER_URI } = process.env;

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors({
        origin: WEB_SERVER_URI,
        credentials: true,
    }));
    app.use('/', router);
    app.listen(PORT, () => console.log(`Backend Server is listening on http://localhost:${PORT}`));
})
.catch(err => {
    console.log('Error occured while connecting to Database:', err);
});