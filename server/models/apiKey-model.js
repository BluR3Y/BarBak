const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    api_key: {
        type: String,
        required: true,
    },
}, { collection: 'apiKeys' });

apiKeySchema.statics.generateAPIKey = async function() {
    const { randomBytes, createHash } = require('crypto');
    const apiKey = randomBytes(16).toString('hex');
    const hashedAPIKey = createHash('md5').update(apiKey).digest('hex');

    if(await this.findOne({ api_key: hashedAPIKey }))
        this.generateAPIKey();
    else
        return { apiKey, hashedAPIKey }; 
}

module.exports = mongoose.model("apiKey", apiKeySchema);