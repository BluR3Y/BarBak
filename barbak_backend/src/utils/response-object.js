const _ = require('lodash');

// const responseObject = async function(object, fields) {
//     const responseObj = {};

//     await Promise.all(fields.map(async (obj) => {
//         if (obj.condition && !obj.condition(object))
//             return;

//         const fieldData = await _.get(object, obj.name);
//         if (obj.sub_fields?.length && Array.isArray(fieldData)) {
//             _.set(responseObj, (obj.alias || obj.name), await Promise.all(fieldData.map(subObj => responseObject(subObj, obj.sub_fields))));
//         } else if (obj.sub_fields?.length && typeof fieldData === 'object') {
//             _.set(responseObj, (obj.alias || obj.name), await responseObject(fieldData, obj.sub_fields));
//         }  else if (typeof fieldData !== 'undefined') {
//             _.set(responseObj, (obj.alias || obj.name), fieldData);
//         }
//     }));

//     return responseObj;
// }

const responseObject = async function(object, fields) {
    const responseObj = {};
    const keysInOrder = fields.map(obj => obj.alias || obj.name);

    for (const key of keysInOrder) {
        const obj = fields.find(obj => obj.alias === key || obj.name === key);

        if (obj.condition && !obj.condition(object))
            continue;

        const fieldData = await _.get(object, obj.name);
        if (obj.sub_fields?.length && Array.isArray(fieldData)) {
            responseObj[key] = await Promise.all(fieldData.map(subObj => responseObject(subObj, obj.sub_fields)));
        } else if (obj.sub_fields?.length && typeof fieldData === 'object') {
            responseObj[key] = await responseObject(fieldData, obj.sub_fields);
        } else if (typeof fieldData !== 'undefined') {
            responseObj[key] = fieldData;
        }
    }

    return responseObj;
}

module.exports = responseObject;