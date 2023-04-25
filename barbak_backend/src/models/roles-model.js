const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    actions: {
        type: [{
            type: String,
            enum: ['create','read','update','delete','manage'],
            required: true
        }],
        validate: (items) => items?.length
    },
    subjects: {
        type: [String],
        required: true,
        validate: (items) => items?.length
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

const Role = mongoose.model('Role', new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    permissions: {
        type: [permissionSchema],
        required: true
    }
},{ collection: 'roles', discriminatorKey: 'variant' }));

const appRoleSchema = Role.schema.add(new mongoose.Schema());

appRoleSchema.path('permissions.subjects').validate(function(subjects) {
    return subjects.every(subject => ['all','users','accounts','media','drinkware','drinks','tools','ingredients'].includes(subject));
}, 'Invalid permission subjects');

appRoleSchema.statics = {
    defaultRole: async function() {
        const { _id } = await this.findOne({ name: 'user' }).select('_id');
        return _id;
    }
}

module.exports = {
    Role,
    AppRole: Role.discriminator('App Role', appRoleSchema)
}