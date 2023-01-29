const mongoose =require('mongoose');

const categoricalDataSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    }
}, { collection: 'categorical-data' });

module.exports = mongoose.model("Categorical-Data", categoricalDataSchema);