const { randomBytes, createCipheriv, createDecipheriv } = require('crypto');

module.exports.encrypt = function(plainData) {
        // Generate a random encryption key
        const encryptionKey = randomBytes(32);

        // Generate a random initialization vector
        const iv = randomBytes(16);
    
        // Create a cipher object using the encryption key and iv
        const cipher = createCipheriv('aes-256-cbc', encryptionKey, iv);
    
        // Encrypt the information using the cipher object
        let encryptedData = cipher.update(plainData, 'utf8', 'hex');
        encryptedData += cipher.final('hex');
    
        return { encryptionKey, iv, encryptedData };
}

module.exports.decrypt = function(encryptionKey, iv, encryptedData) {
    if (typeof encryptionKey === 'object')
        encryptionKey = Buffer.from(encryptionKey);
    if (typeof iv === 'object')
        iv = Buffer.from(iv);

    // Create a decipher object using the encryption key
    const decipher = createDecipheriv('aes-256-cbc', encryptionKey, iv);

    // Decrypt the data using the decipher object
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');

    return decryptedData;
}
