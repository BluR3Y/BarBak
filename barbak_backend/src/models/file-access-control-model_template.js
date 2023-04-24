const mongoose = require('mongoose');
const { Ability, createAliasResolver } = require('@casl/ability');

const fileAccessSchema = new mongoose.Schema({
    file_name: {
        type: String,
        required: true,
    },
    file_size: {
        type: Number,
        required: true,
    },
    mime_type: {
        type: String,
        required: true,
    },
    file_path: {
        type: String,
        required: true,
    },
    permissions: {
        type: [{
            action: {
                type: String,
                required: true,
                enum: ['create', 'read', 'update', 'delete', 'manage']
            },
            conditions: {
                type: Object,
                default: null
            },
            _id: false
        }],
        validate: {
            validator: function(items) {
                return items && items.length;
            },
            message: 'Permissions must be set'
        }
    },
    date_uploaded: {
        type: Date,
        default: () => Date.now()
    }
},{ collection: 'file-access-control', discriminatorKey: 'model' });

fileAccessSchema.virtual('userPermissions').get(function() {
    const aliasResolver = createAliasResolver({
        create: 'post',
        read: 'get',
        update: ['put','patch']
    });

    return new Ability(this.permissions, aliasResolver);
});

fileAccessSchema.methods.authorize = function(action, conditions) {
    return this.userPermissions.can(action, conditions);
}

module.exports = mongoose.model('File Access Control', fileAccessSchema);