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
        default: 'private',
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

drinkwareSchema.statics.getMaterials = async function() {
    const materials = await executeSqlQuery(`SELECT name FROM drinkware_materials`);
    return (await materials.map(item => item.name));
}

drinkwareSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};

    if(await this.model('Drinkware').findOne({ user: this.user._id, name: this.name }))
        error.errors['name'] = "exist";
    
    if (this.material !== "other") {
        const { material_id } = await executeSqlQuery(`SELECT material_id FROM drinkware_materials WHERE name = '${this.material}'`)
            .then(res => res.length ? res[0] : res);
        if (!material_id) 
            error.errors['material'] = "valid";
    }

    if (Object.keys(error.errors).length)
        throw error;
}

module.exports = mongoose.model("Drinkware", drinkwareSchema);