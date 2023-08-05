const _ = require('lodash');

// const responseObject = async function(source, fields) {
//     const responseObj = {};

//     for (const key of fields.map(obj => obj.alias || obj.name)) {
//         const obj = fields.find(obj => obj.alias === key || obj.name === key);
//         if (obj.condition && !obj.condition(source))
//             continue;

//         const fieldData = await _.get(source, obj.name);
//         if (obj.parent_fields?.length && typeof fieldData === 'object') {
//             _.assign(responseObj, await responseObject(fieldData, obj.parent_fields));
//         } else if (obj.child_fields?.length) {
//             _.set(responseObj, key, await (Array.isArray(fieldData) ?
//                 Promise.all(fieldData.map(subObj => responseObject(subObj, obj.child_fields))) :
//                 responseObject(fieldData, obj.child_fields))
//             );
//         } else if (typeof fieldData !== 'undefined') {
//             _.set(responseObj, key, fieldData);
//         }
//     }
//     return responseObj;
// }

const responseObject = async function(source, requestedFields, allowedFields = []) {
    const responseObj = {};

    for (const key of requestedFields.map(obj => obj.alias || obj.name)) {
        const obj = requestedFields.find(obj => obj.alias === key || obj.name === key);

        if (allowedFields.length && !allowedFields.includes(obj.name)) {
            continue;
        } else if (obj.condition && !obj.condition(source)) {
            continue;
        }
        const fieldData = await _.get(source, obj.name);
        if (obj.parent_fields?.length && typeof fieldData === 'object') {
            _.assign(responseObj, await responseObject(fieldData, obj.parent_fields));
        } else if (obj.child_fields?.length) {
            _.set(responseObj, key, await (Array.isArray(fieldData) ?
                Promise.all(fieldData.map(subObj => responseObject(subObj, obj.child_fields))) :
                responseObject(fieldData, obj.child_fields))
            );
        } else if (typeof fieldData !== 'undefined') {
            _.set(responseObj, key, fieldData);
        }
    }
    return responseObj;
}

module.exports = responseObject;

