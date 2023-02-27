const mongoose = require('mongoose');

const DrinkRatingSchema = new mongoose.Schema({
    referenced_drink: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Public Drink',
        required: [true, 'Drink identifier is required']
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User identifier is required']
    },
    score: {
        type: Number,
        required: [true, 'Rating score is required'],
        min: [0, 'Score is less than permitted amount'],
        max: [5, 'Score is greater than permitted amount']
    },
    comment: {
        type: String,
        maxLength: [600, 'Comment length must not exceed 600 characters']
    },
    date_rated: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
},{ collection: 'drink-ratings' });

module.exports = mongoose.model("Drink Rating", DrinkRatingSchema);