const mongoose = require('mongoose');
const Promise = require('bluebird');

const connectDB = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(process.env.MONGODB_URI)
        .then((db) => resolve(db))
        .catch(err => reject(err));
    })
}

const ready = connectDB();

module.exports = ready;