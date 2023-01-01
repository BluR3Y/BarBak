const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({

}, { collection: 'ingredients' });

module.exports = mongoose.model("ingredients", ingredientSchema);