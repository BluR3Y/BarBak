const FileOperations = require('../utils/file-operations');

module.exports.getFile = async (req, res) => {
    try {
        const { filename } = req.params;
        
        const image = await FileOperations.readSingle('assets/images/', filename);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(image, 'binary');
    } catch(err) {
        return res.status(500).send(err);
    }
}