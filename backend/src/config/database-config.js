const mongoose = require('mongoose');
const mysql = require('mysql');
const redis = require('redis');
const Promise = require('bluebird');
const { accessibleRecordsPlugin, accessibleFieldsPlugin } = require('@casl/mongoose');

// MongoDB Connection
const mongoConnect = () => {
    const { NODE_ENV, MONGO_HOST, MONGO_USER, MONGO_PASSWORD, MONGO_PORT, MONGO_DATABASE } = process.env;
    // const mongoUri = `mongodb${NODE_ENV === 'production' ? '+srv' : ''}://${MONGO_USER}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`;
    const mongoUri = NODE_ENV === 'production' ?
        `mongodb+srv://${MONGO_USER}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOST}/${MONGO_DATABASE}` :
        `mongodb://${MONGO_USER}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`;
    const mongoConfig = { useNewUrlParser: true, useUnifiedTopology: true };
    mongoose.set('strictQuery', false);
    mongoose.plugin(accessibleRecordsPlugin);
    mongoose.plugin(accessibleFieldsPlugin, {
        getFields: (schema) => ([
            ...Object.keys({
                ...schema.paths,
                ...schema.virtuals
            }),
            ...(schema.discriminators ? Object.entries(schema.discriminators).reduce((accumulator, [key, value]) => {
                return [
                    ...accumulator,
                    ...Object.keys({
                        ...value.paths,
                        ...value.virtuals
                    })
                ]
            }, []) : [])
        ])
    });
    return mongoose.connect(mongoUri, mongoConfig);
}

// MYSQL Connection
const mysqlConnection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
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
    // mongoConnect(), 
    // mysqlConnection.connect(), 
    // redisClient.connect()
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