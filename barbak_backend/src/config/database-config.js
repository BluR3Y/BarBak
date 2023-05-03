const mongoose = require('mongoose');
const mysql = require('mysql');
const redis = require('redis');
const Promise = require('bluebird');
const { accessibleRecordsPlugin, accessibleFieldsPlugin } = require('@casl/mongoose');

// MongoDB Connection
const mongoConnect = () => {
    const mongoUri = process.env.MONGODB_URI;
    const mongoConfig = { useNewUrlParser: true, useUnifiedTopology: true };
    mongoose.set('strictQuery', false);
    mongoose.plugin(accessibleRecordsPlugin);
    mongoose.plugin(accessibleFieldsPlugin, {
        getFields: (schema) => Object.keys({ ...schema.paths, ...schema.virtuals })
    });
    return mongoose.connect(mongoUri, mongoConfig);
}

// MYSQL Connection
const mysqlConnection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: 'barbak'
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
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
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