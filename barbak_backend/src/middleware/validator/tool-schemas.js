const Joi = require('joi');

const toolName = Joi.string().lowercase().min(3).max(30);
const toolDescription = Joi.string().max(600);
const toolType = Joi.string().max(15);
const toolMaterial = Joi.string().max(15);

const documentID = Joi.string().hex().length(24);
const paginationPage = Joi.number().min(1).max(100);
const paginationPageSize = Joi.number().min(1).max(15);

const createToolSchema = Joi.object({
    name: toolName.required(),
    description: toolDescription,
    type: toolType.required(),
    material: toolMaterial.required()
});
const updateToolSchema = Joi.object({
    tool_id: documentID.required(),
    name: toolName.required(),
    description: toolDescription,
    type: toolType.required(),
    material: toolMaterial.required()
});
const getPrivateToolSchema = Joi.object({
    page: paginationPage.required(),
    page_size: paginationPageSize.required()
});

module.exports = {
    '/tools/create': createToolSchema,
    '/tools/update': updateToolSchema,
    '/tools/private': getPrivateToolSchema,
};