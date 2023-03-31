const mongoose = require('mongoose');
const { executeSqlQuery } = require('../config/database-config');
const { default_covers } = require('../config/config.json');

const toolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30,
    },
    description: {
        type: String,
        maxlength: 600,
    },
    category: {
        type: String,
        required: true,
    }
},{ collection: 'tools', discriminatorKey: 'model' });

// toolSchema.query.basicInfo = function() {
//     return new Promise((resolve, reject) => {
//         this.exec(function(err, documents) {
//             if (err)
//                 return reject(err);
//             resolve(documents.map(doc => doc.extendedStripExcess()));
//         });
//     });
// }

// toolSchema.query.extendedInfo = function() {
//     return new Promise((resolve, reject) => {
//         this.exec(function(err, documents) {
//             if (err)
//                 return reject(err);
//             resolve(documents.map(doc => doc.basicStripExcess()));
//         });
//     });
// }

toolSchema.query.categoryFilter = function(categories) {
    return categories.length ? this.where('category').in(categories) : this;
}

toolSchema.statics = {
    // formatCoverImage: function(filepath) {
    //     const { HOSTNAME, PORT } = process.env;
    //     if (!filepath) {
    //         const defaultCover = fileOperations.findByName('static/default', 'barware_cover');
    //         if (defaultCover.length)
    //             filepath = 'assets/default/' + defaultCover;
    //     }
    //     return filepath ? `http://${HOSTNAME}:${PORT}/${filepath}` : null;
    // },
    getCategories: async function() {
        const categories = await executeSqlQuery('SELECT name FROM tool_categories');
        return (await categories.map(item => item.name));
    },
    validateCategories: async function(categories) {
        const errors = {};
        if (!Array.isArray(categories))
            categories = [categories];

        await Promise.all(categories.map(async category => {
            const [{ categoryCount }] = await executeSqlQuery('SELECT COUNT(*) AS categoryCount FROM tool_categories WHERE name = ? LIMIT 1;', [category]);
            if (!categoryCount)
                errors[category] = { type: 'valid', message: 'Invalid tool category' };
        }));

        return { isValid: !Object.keys(errors).length, errors };
    }
}

toolSchema.methods.customValidate = async function() {
    const error = new Error();
    error.name = "CustomValidationError";
    error.errors = {};

    const categoryValidation = await this.constructor.validateCategories(this.category);
    if (!categoryValidation.isValid)
        error.errors['category'] = categoryValidation.errors[0];
    
    if (Object.keys(error.errors).length)
        throw error;
}

toolSchema.virtual('cover_url').get(function() {
    const { HOSTNAME, PORT, NODE_ENV } = process.env;
    const verified = this.model === 'Verified Tool';
    let filepath;

    if (verified && this.cover) 
        filepath = this.cover;
    else if (!verified && this.cover_acl)
        filepath = 'assets/private/' + this.cover_acl;
    else 
        filepath = default_covers['tool'] ? 'assets/default/' + default_covers['tool'] : null;

    return filepath ? `${NODE_ENV === 'production' ? 'https' : 'http'}://${HOSTNAME}:${PORT}/${filepath}` : filepath;
});

const Tool = mongoose.model('Tool', toolSchema);

const verifiedSchema = new mongoose.Schema({
    cover: {
        type: String,
        default: null
    },
    date_verified: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

// verifiedSchema.methods = {
//     basicStripExcess: function() {
//         return {
//             _id: this._id,
//             name: this.name,
//             description: this.description,
//             category: this.category,
//             cover: this.constructor.formatCoverImage(this.cover),
//             date_verified: this.date_verified
//         }
//     },
//     extendedStripExcess: function() {
//         return {
//             _id: this._id,
//             name: this.name,
//             description: this.description,
//             category: this.category,
//             cover: this.constructor.formatCoverImage(this.cover)
//         }
//     }
// }

const userSchema = new mongoose.Schema({
    cover_acl: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'App Access Control',
        default: null
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    public: {
        type: Boolean,
        default: false,
    },
    date_created: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    }
});

// userSchema.methods = {
//     basicStripExcess: function() {
//         return {
//             _id: this._id,
//             // user: this.user,
//             name: this.name,
//             description: this.description,
//             category: this.category,
//             cover: this.constructor.formatCoverImage(this.cover_acl ? `assets/private/${this.cover_acl}` : null),
//             date_created: this.date_created,
//             public: this.public
//         }
//     },
//     extendedStripExcess: function() {
//         return {
//             _id: this._id,
//             // user: this.user,
//             name: this.name,
//             description: this.description,
//             category: this.category,
//             cover: this.constructor.formatCoverImage(this.cover_acl ? `assets/private/${this.cover_acl}` : null),
//         }
//     }
// }

// Make Public Function

module.exports = {
    Tool,
    VerifiedTool: Tool.discriminator('Verified Tool', verifiedSchema),
    UserTool: Tool.discriminator('User Tool', userSchema)
};