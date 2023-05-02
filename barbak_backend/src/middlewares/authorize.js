const { Ability, createAliasResolver, ForbiddenError } = require('@casl/ability');
const AppError = require('../utils/app-error');
const { executeSqlQuery } = require('../config/database-config');
const { user_roles } = require('../config/config.json');
const mongoose = require('mongoose');

async function defineUserAbilities(user) {
    const aliasResolver = createAliasResolver({
        create: 'post',
        read: 'get',
        update: ['put','patch']
    });
    const subjectDetector = (obj) => {
        if (obj.constructor)
            return obj.constructor.__resourceType();
        return obj.__resourceType;
    };
    ForbiddenError.setDefaultMessage('Unauthorized request');

    const userPermissions = await executeSqlQuery(`
        SELECT
            role_permissions.action,
            role_permissions.subject,
            role_permissions.fields,
            role_permissions.conditions,
            role_permissions.inverted,
            role_permissions.reason
        FROM user_roles
        JOIN user_permissions
            ON user_roles.id = user_permissions.role_id
        JOIN role_permissions
            ON role_permissions.id = user_permissions.permission_id
        WHERE user_roles.id = ?
    `, [user?.role || user_roles.guest]);
    const jsonPermissions = userPermissions.map(({ action, subject, fields, conditions, inverted, reason }) => ({
        action: JSON.parse(action),
        subject: JSON.parse(subject),
        fields: (fields ? JSON.parse(fields) : fields),
        conditions: (conditions ? JSON.parse(conditions.replace(/"USER_ID"/g, `"${user?._id}"`)) : conditions),
        inverted,
        reason
    }));
    // console.log(jsonPermissions.filter(item => true))     // debugging
    return new Ability(jsonPermissions,{ resolveAction: aliasResolver, detectSubjectType: subjectDetector });
}

module.exports = async (req, res, next) => {
    try {
        const user = req.user;
        const action = req.method.toLowerCase();
        const resource = req.path.split('/')[1];

        const ability = await defineUserAbilities(user);
        if (!ability.can(action, resource))
            throw new AppError(403, 'FORBIDDEN', 'Unauthorized request');
        req.ability = ability;
        next();
    } catch(err) {
        next(err);
    }
}