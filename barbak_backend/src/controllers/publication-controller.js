const FileOperations = require('../utils/file-operations');
const PublicationRequest = require('../models/publication-request-model');
const PublicationValidation = require('../models/publication-validation-model');
const { PublicTool, PrivateTool } = require('../models/tool-model');
const { PublicDrinkware, PrivateDrinkware } = require('../models/drinkware-model');

module.exports.tester = async (req, res) => {
    try {
        const createdValidation = new PublicationValidation({
            referenced_request: '63f6a29395029ede70370097',
            validator: req.user._id,
            validation: true,
            reasoning: 'blah blah blah'
        });
        await createdValidation.save();
    } catch(err) {

    }
    res.send('lol')
}

module.exports.publishTool = async (req, res) => {
    try {
        const { tool_id } = req.body;
        const toolDocument = await PrivateTool.findOne({ _id: tool_id, user_id: req.user._id });

        if (!toolDocument)
            return res.status(400).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        else if (await PublicationRequest.exists({ referenced_document: toolDocument._id, referenced_model: 'Private Tool', user_id: req.user._id, activeRequest: true }))
            return res.status(400).send({ path: 'referenced_document', type: 'exist', message: 'Tool is currently being review' });
        else if (await PublicTool.exists({ name: toolDocument.name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: `A public tool named '${toolDocument.name}' currently exists` });

        const { _id, name, description, type, material, image } = toolDocument;
        const createdRequest = new PublicationRequest({
            referenced_document: _id,
            referenced_model: 'Private Tool',
            user_id: req.user._id,
            snapshot: {
                name,
                description,
                type,
                material
            }
        });
        await createdRequest.validate();
        
        const snapshot_image = image ? await FileOperations.copySingle(image, 'assets/private/images/') : null;
        createdRequest.snapshot.image = snapshot_image;
        await createdRequest.save();

        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.publishDrinkware = async (req, res) => {
    try {
        const { drinkware_id } = req.body;
        const drinkwareDocument = await PrivateDrinkware.findOne({ _id: drinkware_id, user_id: req.user._id });
        console.log(drinkware_id)
        if (!drinkwareDocument)
            return res.status(400).send({ path: 'drinkware_id', type: 'exist', message: 'Drinkware does not exist' });
        else if (await PublicationRequest.exists({ referenced_document: drinkwareDocument._id, referenced_model: 'Private Drinkware', user_id: req.user._id, activeRequest: true }))
            return res.status(400).send({ path: 'referenced_document', type: 'exist', message: 'Drinkware is currently being review' });
        else if (await PublicDrinkware.exists({ name: drinkwareDocument.name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: `A public drinkware named '${toolDocument.name}' currently exists` });
        
        const { _id, name, description, material, image } = drinkwareDocument;
        const createdRequest = new PublicationRequest({
            referenced_document: _id,
            referenced_model: 'Private Drinkware',
            user_id: req.user._id,
            snapshot: {
                name,
                description,
                material
            }
        });
        await createdRequest.validate();

        const snapshot_image = image ? await FileOperations.copySingle(image, 'assets/private/images/') : null;
        createdRequest.snapshot.image = snapshot_image;
        await createdRequest.save();

        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.validate = async (req, res) => {
    try {
        const { referenced_request, validation, reasoning } = req.body;
        
        const requestedPublication = await PublicationRequest.findOne({ _id: referenced_request });

        if (!requestedPublication)
            return res.status(400).send({ path: 'request', type: 'exist', message: 'Publication request does not exist' });
        else if (!requestedPublication.activeRequest)
            return res.status(401).send({ path: 'request', type: 'valid', message: 'Request is inactive' });
        else if (requestedPublication.user_id.equals(req.user._id))
            return res.status(401).send({ path: 'user', type: 'valid', message: 'You are not allowed to validate your own publication requests' });
        else if (await PublicationValidation.exists({ referenced_request, validator: req.user._id }))
            return res.status(400).send({ path: 'user', type: 'exist', message: 'You already submitted a validation for this request' });
        
        const createdValidation = new PublicationValidation({
            referenced_request,
            validator: req.user._id,
            validation,
            reasoning
        });
        await createdValidation.validate();
        await createdValidation.save();
        
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.pending = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const page_size = req.query.page_size || 10;
        const types = req.query.types ? JSON.parse(req.query.types) : null;

        var pendingDocuments = await PublicationRequest.find({ activeRequest: true, user_id: { $ne: req.user._id } })
            .filterByType(types)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .select('snapshot referenced_model');

        pendingDocuments = pendingDocuments.map(doc => {
            var modifiedDoc = doc.toObject({ virtuals: ['requestType'] });
            delete modifiedDoc.referenced_model;
            return modifiedDoc;
        });

        res.status(200).send(pendingDocuments);
    } catch(err) {
        res.status(500).send(err);
    }
}
