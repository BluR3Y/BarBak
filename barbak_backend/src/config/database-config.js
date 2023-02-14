const mongoose = require('mongoose');
const Promise = require('bluebird');
const mysql = require('mysql');

const connectMongo = () => {
    return new Promise((resolve, reject) => {
        const { MONGODB_URI } = process.env;
        mongoose.set('strictQuery', false);
        mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then((db) => resolve(db))
        .catch(err => reject(err));
    })
}

const MySQLConnection = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    database: 'barbak',
    user: 'root',
    password: process.env.MYSQL_PASSWORD
});

const connectMySQL = () => {
    return new Promise((resolve, reject) => {
        MySQLConnection.connect(function(err) {
            if (err) return reject(err);
            resolve();
        })
    })
}

const executeSqlQuery = function(query, values) {
    return new Promise((resolve, reject) => {
        MySQLConnection.query(query, values, (err, results) => {
            if (err) return reject(err);
            return resolve(results);
        })
    })
}

const ready = Promise.all([
    connectMongo(),
    connectMySQL()
]);

module.exports = {
    ready,
    // Returns the current mongoose instance
    getMongoose: () => mongoose,
    executeSqlQuery: executeSqlQuery
}