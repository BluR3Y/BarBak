const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({

}, { collection: 'user-ingredients' });

module.exports = mongoose.model("ingredients", ingredientSchema);