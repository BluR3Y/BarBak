const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');

const publicToolSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 30,
        required: true,
    },
    description: {
        type: String,
        maxLength: 500,
    },
    type: {
        type: String,
        required: true
    },
    material: {
        type: String,
    },
    image: {
        type: String,
    },
    visibility: {
        type: String,
        required: true,
        lowercase: true,
        immutable: true,
        default: 'public',
    },
    creation_date: {
        type: Date,
        required: true,
        immutable: true,
        default: () => Date.now(),
    }
}, { collection: 'tools', discriminatorKey: 'model' });

publicToolSchema.query.visibility = function(user) {
    if (!user)
        return this.where({ visibility: 'public' });
    return this.or([ { visibility: 'public' }, { user: user._id } ]);
}

publicToolSchema.query.publicInfo = function() {
    return this.select('name description type material image -model');
}

publicToolSchema.statics.getTypes = async function() {
    const types = await executeSqlQuery(`SELECT name FROM tool_types`);
    return (await types.map(item => item.name))
}

publicToolSchema.statics.getMaterials = async function() {
    const materials = await executeSqlQuery(`SELECT name FROM tool_materials`);
    return (await materials.map(item => item.name));
}

publicToolSchema.statics.validateType = async function(type) {
    const {type_id} = await executeSqlQuery(`SELECT type_id FROM tool_types WHERE name = '${type}';`)
        .then(res => res.length ? res[0] : res);
    return (type_id !== undefined);
}

publicToolSchema.statics.validateMaterial = async function(material) {
    const {material_id} = await executeSqlQuery(`SELECT material_id FROM tool_materials WHERE name = '${material}';`)
        .then(res => res.length ? res[0] : res);
    return (material_id !== undefined);
}

const privateToolSchema = new mongoose.Schema({
    visibility: {
        type: String,
        required: true,
        lowercase: true,
        default: 'private',
        enum: {
            values: [ 'in-review', 'private' ]
        }
    },
    user_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    }
});

privateToolSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = [];

    if (this.type !== "other") {
        const {type_id} = await executeSqlQuery(`SELECT type_id FROM tool_types WHERE name = '${this.type}';`)
            .then(res => res.length ? res[0] : res);
        if (!type_id)
            error.errors[`type`] = "valid";
    }
    if (this.material !== "other") {
        const {material_id} = await executeSqlQuery(`SELECT material_id FROM tool_materials WHERE name = '${this.material}';`)
            .then(res => res.length? res[0] : res);
        if (!material_id)
            error.errors[`material`] = "valid";
    }
    if (Object.keys(error.errors).length)
        throw error;
}

privateToolSchema.methods.createPublicationValidationItem = async function( validator, validation, reasoning) {
    const createdValidation = new PublicationValidation({
        referencedDocument: this._id,
        referencedModel: 'Private Tool',
        validator,
        validation,
        reasoning
    });
    await createdValidation.validate();
    await createdValidation.save();

    // createdValidation.populate({ path: 'referencedDocument', model: 'Private Tool', select: 'user name description type material -model' })
    // .then(res => console.log(res))
}

const publicTool = mongoose.model('Public Tool', publicToolSchema);
const privateTool = publicTool.discriminator('Private Tool', privateToolSchema);

module.exports = { privateTool, publicTool };