const mongoose = require('mongoose');
const {executeSqlQuery} = require('../config/database-config');

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
    if (type === 'other') return true;

    const category = await executeSqlQuery(` SELECT category_id FROM categorical_data WHERE category_group = "drinkware" AND category = "drinkware_materials" `);
    const category_item = await executeSqlQuery(` SELECT category_item_id FROM categorical_data_item WHERE category_id = ${category[0].category_id} AND data = "${type}" `);
    
    return (category_item.length > 0);
}

module.exports = mongoose.model("Drinkware", drinkwareSchema);