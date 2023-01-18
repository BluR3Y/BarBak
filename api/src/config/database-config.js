const mongoose = require('mongoose');
const Promise = require('bluebird');

const connectDB = () => {
    return new Promise((resolve, reject) => {
        const { MONGODB_URI } = process.env;
        mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then((db) => resolve(db))
        .catch(err => reject(err));
    })
}

const ready = connectDB();

module.exports = ready;