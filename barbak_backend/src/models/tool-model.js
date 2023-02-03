const mongoose = require('mongoose');
const {executeSqlQuery} = require('../config/database-config');

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
        required: true
    },
    material: {
        type: String,
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
        required: true,
        immutable: true,
        default: () => Date.now(),
    }
}, { collection: 'tools' });

toolSchema.statics.getTypes = async function() {
    const types = await executeSqlQuery(`SELECT name FROM tool_types`);
    return (await types.map(item => item.name))
}

toolSchema.statics.getMaterials = async function() {
    const materials = await executeSqlQuery(`SELECT name FROM tool_materials`);
    return (await materials.map(item => item.name));
}

toolSchema.statics.validateType = async function(type) {
    if (type === "other") return true;

    const res = await executeSqlQuery(`SELECT type_id FROM tool_types WHERE name = '${type}';`);
    return (res.length > 0);
}

toolSchema.statics.validateMaterial = async function(material) {
    if (material === "other") return true;

    const res = await executeSqlQuery(`SELECT material_id FROM tool_materials WHERE name = '${material}';`);
    return (res.length > 0);
}

module.exports = mongoose.model("Tool", toolSchema);