const mongoose = require('mongoose');

const drinkwareMaterials = [ "crystal", "wood", "glass", "stainess-steel", "ceramic", "copper", "bamboo", "silicone", "acrylic", "paper", "other" ];

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
        enum: drinkwareMaterials
    },
    // capacity: {
    //     type: Number,
    //     validate: {
    //         validator: val => val > 0 && val < 3785   // standard unit of measurement for liquids are milliliters
    //     }
    // },
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

module.exports = mongoose.model("Drinkware", drinkwareSchema);