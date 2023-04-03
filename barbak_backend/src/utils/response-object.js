const _ = require('lodash');

const responseObject = function(object, fields) {
    const responseObj = {};

    for (const obj of fields) {
        if (obj.conditions && !obj.conditions(object))
            continue;

        if (_.hasIn(object, obj.name)) {
            if (obj.sub_fields) {
                _.set(responseObj, (obj.alias || obj.name),  _.get(object, obj.name).map(subObj => responseObject(subObj, obj.sub_fields)))
            } else {
                _.set(responseObj, (obj.alias || obj.name), _.get(object, obj.name));
            }
        }
    }
    return responseObj;
}

module.exports = responseObject;