const FileOperations = require('../utils/file-operations');
const { PublicTool, PrivateTool } = require('../models/tool-model');
// const { PublicationRequest, PublicationValidation } = require('../models/publication-model_old');

module.exports.create = async (req, res) => {
    try {
        const { name, description, type, material } = req.body;

        if(await PrivateTool.exists({ user_id: req.user._id, name }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });
        
        const createdTool = new PrivateTool({
            name,
            description,
            type,
            material,
            user_id: req.user._id
        });
        await createdTool.validate();
        await createdTool.customValidate();
        await createdTool.save();
        
        res.status(204).send();
    } catch(err) {
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
        res.status(500).send(err);
    }
}

module.exports.uploadToolImage = async (req, res) => {
    try {
        const { tool_id } = req.body;
        const toolImage = req.file || null;

        if (!toolImage)
            return res.status(400).send({ path: 'image', type: 'exist', message: 'No image was uploaded' });

        const toolDocument = await PrivateTool.findOne({ user_id: req.user._id, _id: tool_id });
        if (!toolDocument)
            return res.status(400).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });

        const uploadInfo = await FileOperations.uploadSingle('assets/private/images/', toolImage);
        if (toolDocument.image)
            await FileOperations.deleteSingle(toolDocument.image);
        toolDocument.image = uploadInfo.filepath;
        toolDocument.save();
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.update = async (req, res) => {
    try {
        const { tool_id, name, description, type, material } = req.body;

        if (await PrivateTool.exists({ user_id: req.user._id, name, _id: { $ne:tool_id } }))
            return res.status(400).send({ path: 'name', type: 'exist', message: 'A tool with that name currently exists' });

        const toolDocument = await PrivateTool.findOne({ user_id: req.user._id, _id: tool_id });
        if (!toolDocument)
            return res.status(400).send({ path: 'tool_id', type: 'exist', message: 'Tool does not exist' });
        
        toolDocument.name = name;
        toolDocument.description = description;
        toolDocument.type = type;
        toolDocument.material = material;
        await toolDocument.validate();
        await toolDocument.customValidate();
        await toolDocument.save();

        res.status(204).send();
    } catch(err) {
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
        res.status(500).send(err);
    }
}



// module.exports.getPendingPublications = async (req, res) => {
//     try {
//         const { 
//             page = 1,
//             page_size = 10
//         } = req.query;

//         if (page < 1)
//             return res.status(400).send({ path: 'page', type: 'valid', message: 'page must be greater or equal to 1' });
//         else if (page_size < 1 || page_size > 10)
//             return res.status(400).send({ path: 'page_size', type: 'valid', message: 'page_size must be greater than 0 and less than 11' });

//         const pendingTools = await PublicationRequest.find({ activeRequest: true, user_id: { $ne: req.user._id } })
//             .skip((page - 1) * page_size)
//             .limit(page_size)
//             .select('snapshot');

//         res.status(200).send(pendingTools);
//     } catch(err) {
//         res.status(500).send(err);
//     }
// }

// Needs Improving
// module.exports.search = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const page_size = parseInt(req.query.page_size) || 5;
//         const query = req.query.query || "";
//         var types = req.query.types ? JSON.parse(req.query.types) : null;
//         var materials = req.query.materials ? JSON.parse(req.query.materials) : null;

//         if (page <= 0)
//             return res.status(400).send({ path: 'page', type: 'valid' });
//         else if (page_size > 20 || page_size < 1)
//             return res.status(400).send({ path: 'page_size', type: 'valid' });
        
//         if (types !== null) {
//             for(const index in types) {
//                 if (!await privateTool.validateType(types[index]))
//                     return res.status(400).send({ path: 'types', type: 'valid', index });
//             }
//         } else 
//             types = await publicTool.getTypes();

//         if (materials !== null) {
//             for(const index in materials) {
//                 if (!await privateTool.validateMaterial(materials[index]))
//                     return res.status(400).send({ path: 'materials', type: 'valid', index });
//             }
//         } else
//             materials = await publicTool.getMaterials();

//         const result = await publicTool.find({ name: { $regex: query } })
//             .where("type").in(types)
//             .where("material").in(materials)
//             .skip((page - 1) * page_size)
//             .limit(page_size)
//             .select("name type material -model");
        
//         res.status(200).send(result);
//     } catch (err) {
//         res.status(500).send(err);
//     }
// }

module.exports.getPrivateTools = async (req, res) => {
    try {
        const {
            page = 1,
            page_size = 10
        } = req.query;

        const userTools = await PrivateTool
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
        const toolTypes = await PrivateTool.getTypes();
        res.status(200).send(toolTypes);
    } catch(err) {
        res.status(500).send(err);
    }
}

module.exports.getToolMaterials = async (req, res) => {
    try {
        const toolMaterials = await PrivateTool.getMaterials();
        res.status(200).send(toolMaterials);
    } catch(err) {
        res.status(500).send(err);
    }
}