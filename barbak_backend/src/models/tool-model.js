const mongoose = require('mongoose');
const CategoricalData = require('../models/categorical-data');
const _ = require('lodash');

const toolSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 30,
        required: true
    },
    description: {
        type: String,
        maxLength: 500
    },
    type: {
        type: String,
        ref: "Categorical-Data",
        required: true
    },
    material: {
        type: String,
        ref: "Categorical-Data",
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
        required: true,
        immutable: true,
        default: () => Date.now(),
    }
}, { collection: 'tools' });

toolSchema.statics.validateType = async function(type) {
    const types = await CategoricalData.findOne({ category: "tool_types" }).select("data");
    return _.includes(types.data, type);
}

toolSchema.statics.validateMaterial = async function(type) {
    const types = await CategoricalData.findOne({ category: "tool_materials" }).select("data");
    return _.includes(types.data, type);
}

module.exports = mongoose.model("Tool", toolSchema);