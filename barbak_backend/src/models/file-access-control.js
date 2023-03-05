const mongoose = require('mongoose');

// const aclSchema = new mongoose.Schema({
//     file_name: {
//         type: String,
//         required: true,
//     },
//     file_size: {
//         type: Number,
//         required: true
//     },
//     file_type: {
//         type: String,
//         required: true
//     },
//     file_path: {
//         type: String,
//         required: true
//     },
//     permissions: {
//         type: [{
//             user_id: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: 'User',
//                 required: true
//             },
//             access: {
//                 type: String,
//                 enum: ['read', 'write'],
//                 required: true
//             }
//         }],
//         default: []
//     },
//     date_uploaded: {
//         type: Date,
//         default: () => Date.now()
//     }
// },{ collection: 'acl' });

// module.exports = mongoose.model('access-control-list', aclSchema);

const aclSchema = new mongoose.Schema({
    file_name: {
        type: String,
        required: true,
    },
    file_size: {
        type: Number,
        required: true
    },
    mime_type: {
        type: String,
        required: true
    },
    file_path: {
        type: String,
        required: true
    },
    // permissions: {
    //     type: [{
    //         role: {
    //             type: String,
    //             enum: ['admin','user','guest'],
    //             required: true
    //         },
    //         access: {
    //             type: String,
    //             enum: ['read', 'write'],
    //             required: true
    //         }
    //     }],
    //     default: [
    //         {
    //             role: 'admin',
    //             access: 'write'
    //         },
    //         {
    //             role: 'user',
    //             access: 'read'
    //         },
    //     ]
    // },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date_uploaded: {
        type: Date,
        default: () => Date.now()
    }
});

module.exports = mongoose.model('access-control-list', aclSchema);