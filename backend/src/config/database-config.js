const mongoose = require('mongoose');
const mysql = require('mysql');
const redis = require('redis');
const Promise = require('bluebird');
const { accessibleRecordsPlugin } = require('@casl/mongoose');

// MongoDB Connection
const mongoConnect = () => {
    const { NODE_ENV, MONGO_HOST, MONGO_ACCESS_USER, MONGO_ACCESS_PASSWORD, MONGO_PORT, MONGO_DATABASE } = process.env;
    const mongoUri = NODE_ENV === 'production' ?
        `mongodb+srv://${MONGO_ACCESS_USER}:${encodeURIComponent(MONGO_ACCESS_PASSWORD)}@${MONGO_HOST}/${MONGO_DATABASE}` :
        `mongodb://${MONGO_ACCESS_USER}:${encodeURIComponent(MONGO_ACCESS_PASSWORD)}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`;
    const mongoConfig = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
    // Throw mongoose error if querying fields aren't defined
    mongoose.set('strictQuery', true);
    // Attaching a global mongoose plugin
    mongoose.plugin(accessibleRecordsPlugin);
    return mongoose.connect(mongoUri, mongoConfig);
}

// MYSQL Connection
const mysqlConnection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_ACCESS_USER,
    password: process.env.MYSQL_ACCESS_PASSWORD
});
const executeSqlQuery = function(query, values) {
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, values, (err, results) => {
            if (err) return reject(err);
            return resolve(results);
        })
    })
}

// Redis Connection
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

const ready = Promise.all([
    mongoConnect(), 
    mysqlConnection.connect(), 
    redisClient.connect()
]);

module.exports = {
    ready,
    // Returns the current mongoose instance
    getMongoose: () => mongoose,
    // Query MySQL Database
    executeSqlQuery,
    // Returns the current redis instance
    redisClient
}