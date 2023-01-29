const mongoose = require('mongoose');
const CategoricalData = require('../models/categorical-data');
const _ = require('lodash');

// const drinkwareMaterials = [ "crystal", "wood", "glass", "stainess-steel", "ceramic", "copper", "bamboo", "silicone", "acrylic", "paper", "other" ];

const drinkwareSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 30,
        lowercase: true,
        required: true
    },
    description: {
        type: String,
        maxLength: 500,
    },
    material: {
        type: String,
        required: true,
    },
    image: {
        type: String
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
        immutable: true,
    },
    visibility: {
        type: String,
        required: true,
        lowercase: true,
        enum: {
            values: ['private', 'public', 'in-review'],
            message: props => `${props.value} is not a valid 'visibility' state`,
        }
    },
    creation_date: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    }
}, { collection: 'drinkware' });

drinkwareSchema.statics.validateMaterial = async function(type) {
    const types = await CategoricalData.findOne({ category: "drinkware_materials" });
    return _.includes(types.data, type);
}

module.exports = mongoose.model("Drinkware", drinkwareSchema);