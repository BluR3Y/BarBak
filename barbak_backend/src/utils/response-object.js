const _ = require('lodash');

const responseObject = async function(object, fields) {
    const responseObj = {};

    await Promise.all(fields.map(async (obj) => {
        if (obj.condition && !obj.condition(object))
            return;

        const fieldData = await _.get(object, obj.name);
        if (obj.sub_fields?.length && Array.isArray(fieldData)) {
            _.set(responseObj, (obj.alias || obj.name),  fieldData.map(subObj => responseObject(subObj, obj.sub_fields)));
        } else if (obj.sub_fields?.length && typeof fieldData === 'object') {
            _.set(responseObj, (obj.alias || obj.name), responseObject(fieldData, obj.sub_fields));
        }  else if (typeof fieldData !== 'undefined') {
            _.set(responseObj, (obj.alias || obj.name), fieldData);
        }
    }));

    return responseObj;
}

module.exports = responseObject;