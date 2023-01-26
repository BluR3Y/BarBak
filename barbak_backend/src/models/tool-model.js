const mongoose = require('mongoose');

// const toolSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         minLength: 3,
//         maxlength: 30,
//         required: true,
//     },
//     description: {
//         type: String,
//         maxLength: 500,
//     },
//     user: {
//         type: mongoose.SchemaTypes.ObjectId,
//         required: true,
//         immutable: true,
//     },
//     visibility: {
//         type: String,
//         required: true,
//         lowercase: true,
//         enum: {
//             values: ['private', 'public', 'in-review'],
//             message: props => `${props.value} is not a valid 'visibility' state`,
//         }
//     },
//     creation_date: {
//         type: Date,
//         required: true,
//         immutable: true,
//         default: () => Date.now(),
//     }
// }, { collection: 'tools' });

const toolTypes = [ "mixing", "measuring", "stirring", "muddling", "straining", "opening", "serving", "pouring", "garnishing", "cutting", "chilling", "cleaning", "other" ];

const toolMaterials = [ "stainless steel", "brass", "wood", "plastic", "aluminum", "silicone", "glass", "ceramic", "titanium", "graphite", "other" ];

const toolVisibilities = ['private', 'public', 'in-review'];

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
        enum: toolTypes,
        required: true
    },
    material: {
        type: String,
        enum: toolMaterials,
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
            values: toolVisibilities,
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

module.exports = mongoose.model("Tool", toolSchema);