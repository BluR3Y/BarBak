const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    action: {
        type: [{
            type: String,
            enum: ['create','read','update','delete','manage'],
            required: true
        }],
        validate: (items) => items?.length
    },
    subject: {
        type: [String],
        required: true,
        validate: (items) => items.length
    },
    fields: {
        type: [String],
        default: null
    },
    conditions: {
        type: Object,
        default: null
    },
    inverted: {
        type: Boolean,
        default: false
    },
    reason: {
        type: String,
        default: null
    },
    _id: false
});

const appRoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    permissions: {
        type: [permissionSchema],
        required: true,
        validate: (items) => items.length
    }
},{ collection: 'app-roles' });

appRoleSchema.path('permissions.subject').validate(function(subjects) {
    return subjects.every(subject => ['all','users','accounts','media','drinkware','drinks','tools','ingredients'].includes(subject));
}, 'Invalid permission subjects');

module.exports = {
    AppRole: mongoose.model('App Role', appRoleSchema)
};