const FileOperations = require('../utils/file-operations');
const { privateTool, publicTool } = require('../models/tool-model');
// const PublicationRequest = require('../models/publication-request-model');
// const PublicationValidation = require('../models/publication-validation-model');
const { PublicationRequest, PublicationValidation } = require('../models/publication-request-model');

module.exports.create = async (req, res) => {
    try {
        const { name, description, type, material } = req.body;

        if (await privateTool.findOne({ user_id: req.user._id, name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'Each private tool is required to have a unique name' });

        const createdTool = new privateTool({
            name,
            description,
            type,
            material,
            user_id: req.user._id
        });
        await createdTool.validate();
        await createdTool.customValidate();

        const uploadInfo = req.file ? await FileOperations.uploadSingle('assets/private/images/', req.file) : null;
        createdTool.image = uploadInfo ? uploadInfo.filepath : null;
        await createdTool.save();
    } catch (err) {
        if (err.name === "ValidationError" || err.name === "CustomValidationError") {
            var errors = [];

            Object.keys(err.errors).forEach(error => {
                const errorParts = error.split('.');
                const errorPart = errorParts[0];
                const indexPart = errorParts[1] || '0';
                
                errors.push({ 
                    path: errorPart, 
                    type: (err.name === "ValidationError") ? err.errors[error].properties.type : err.errors[error], 
                    index: indexPart 
                });
            })
            return res.status(400).send(errors);
        }
        return res.status(500).send(err);
    }
    res.status(204).send();
}

module.exports.submitPublication = async (req, res) => {
    try {
        const { toolId } = req.body;
        const toolInfo = await privateTool.findOne({ _id: toolId, user_id: req.user._id });

        if (!toolInfo)
            return res.status(400).send({ path: 'toolId', type: 'exist', message: 'Tool does not exist' });
        else if (await PublicationRequest.exists({ referenced_document: toolInfo._id, referenced_model: 'Private Tool', user_id: req.user._id }))
            return res.status(400).send({ path: 'toolId', type: 'process', message: 'Tool is currently being reviewed' });
        else if (await publicTool.exists({ type: 'Public Tool', name: toolInfo.name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A public tool with this name currently exists' });
            
        const {name, description, type, material, image } = toolInfo;

        const createdRequest = new PublicationRequest({
            referenced_document: toolInfo._id,
            referenced_model: 'Private Tool',
            user_id: req.user._id,
            snapshot: {
                name,
                description,
                type,
                material
            }
        });
        createdRequest.validate();

        const snapshot_image = image ? await FileOperations.copySingle(image, 'assets/private/images/') : null;
        createdRequest.snapshot.image = snapshot_image;
        createdRequest.save();

        res.status(204).send();
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports.getPendingPublications = async (req, res) => {
    try {
        const { 
            page = 1,
            page_size = 10
        } = req.query;

        // if (req.user.experience !== 'expert')
        //     return res.status(401).send({ path: 'experience', type: 'insufficient', message: 'Users must have an experience level of "expert" to validate publication requests' });
        if (page < 1)
            return res.status(400).send({ path: 'page', type: 'valid', message: 'page must be greater or equal to 1' });
        else if (page_size < 1 || page_size > 10)
            return res.status(400).send({ path: 'page_size', type: 'valid', message: 'page_size must be greater than 0 and less than 11' });

        const pendingTools = await PublicationRequest.find()
            .skip((page - 1) * page_size)
            .limit(page_size)
            .select('snapshot');

        res.status(200).send(pendingTools);
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.validatePublication = async (req, res) => {
    try {
        const { referenced_request, validation, reasoning } = req.body;

        // if (req.user.experience !== 'expert')
        //     return res.status(401).send({ path: 'user', type: 'unauthorized', message: 'You are not authorized to validate publication requests' });
        
        const requestedPublication = await PublicationRequest.findOne({ _id: referenced_request, referenced_model: 'Private Tool' });

        if (!requestedPublication)
            return res.status(400).send({ path: 'request', type: 'exist', message: 'Publication request does not exist' });
        else if (!requestedPublication.activeRequest)
            return res.status(401).send({ path: 'request', type: 'valid', message: 'Request is inactive' });
        else if (requestedPublication.user_id.equals(req.user._id))
            return res.status(401).send({ path: 'user', type: 'valid', message: 'You are not allowed to validate your own publication requests' });
        else if (PublicationValidation.exists({ referenced_request, validator: req.user._id }))
            return res.status(400).send({ path: 'user', type: 'exist', message: 'You already submitted a validation for this Request' });
        
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

// module.exports.validatePublication = async (req, res) => {
//     try {
//         // Allow multiple experts, 3, to validate each tool
//         const { publication_request_id, validation, reasoning } = req.body;

//         if (req.user.experience !== 'expert')
//             return res.status(401).send({ path: 'user', type: 'unauthorized', message: 'You are not authorized to validate publication requests' });
        
//         const toolInfo = await privateTool.findOne({ _id: toolId });
//         if (!toolInfo)
//             return res.status(400).send({ path: 'toolId', type: 'exist', message: 'Tool does not exist' });
//         else if (!PublicationRequest.exists({ referenced_document: toolInfo._id, referenced_model: 'Private Tool', user: req.user._id }))
//             return res.status(400).send({ path: 'toolId', type: 'valid', message: 'Review of tool was not requested' });
//         else if (await publicTool.findOne({ name: toolInfo.name }))
//             return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool public tool with this name currently exists' });
//         else if (toolInfo.user.equals(req.user._id))
//             return res.status(400).send({ path: 'user', type: 'valid', message: 'You are not allowed to validate your own publication requests' });

//         if (validation === 'approve') {
//             const { name, description, type, material, image } = toolInfo;
//             const createdPublicTool = new publicTool({
//                 name,
//                 description,
//                 type,
//                 material
//             });
//             await createdPublicTool.validate();
            
//             const uploadInfo = image ? await FileOperations.copySingle('assets/images/', image) : null;
//             createdPublicTool["image"] = uploadInfo;
//             await createdPublicTool.save();
//         }
//         await toolInfo.createPublicationValidationItem( req.user._id, validation, reasoning);

//         // toolInfo["visibility"] = 'private';
//         // await toolInfo.save();
//         res.status(204).send();
//     } catch (err) {
//         res.status(500).send(err);
//     }
// }

// Needs Improving
module.exports.search = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const page_size = parseInt(req.query.page_size) || 5;
        const query = req.query.query || "";
        var types = req.query.types ? JSON.parse(req.query.types) : null;
        var materials = req.query.materials ? JSON.parse(req.query.materials) : null;

        if (page <= 0)
            return res.status(400).send({ path: 'page', type: 'valid' });
        else if (page_size > 20 || page_size < 1)
            return res.status(400).send({ path: 'page_size', type: 'valid' });
        
        if (types !== null) {
            for(const index in types) {
                if (!await privateTool.validateType(types[index]))
                    return res.status(400).send({ path: 'types', type: 'valid', index });
            }
        } else 
            types = await publicTool.getTypes();

        if (materials !== null) {
            for(const index in materials) {
                if (!await privateTool.validateMaterial(materials[index]))
                    return res.status(400).send({ path: 'materials', type: 'valid', index });
            }
        } else
            materials = await publicTool.getMaterials();

        const result = await publicTool.find({ name: { $regex: query } })
            .where("type").in(types)
            .where("material").in(materials)
            .skip((page - 1) * page_size)
            .limit(page_size)
            .select("name type material -model");
        
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports.getPrivateTools = async (req, res) => {
    try {
        const {
            page = 1,
            page_size = 10
        } = req.query;

        const userTools = await privateTool
            .find({ user_id: req.user._id })
            .skip((page - 1) * page_size)
            .limit(page_size)

        res.status(200).send(userTools);
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getToolTypes = async (req, res) => {
    try {
        const toolTypes = await publicTool.getTypes();
        res.status(200).send(toolTypes);
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getToolMaterials = async (req, res) => {
    try {
        const toolMaterials = await publicTool.getMaterials();
        res.status(200).send(toolMaterials);
    } catch(err) {
        res.status(500).send(err);
    }
}