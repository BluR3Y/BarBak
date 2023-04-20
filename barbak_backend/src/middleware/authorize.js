const { Ability, createAliasResolver } = require('@casl/ability');
const { executeSqlQuery } = require('../config/database-config');

async function defineUserAbilities(user) {
    const aliasResolver = createAliasResolver({
        create: 'post',
        read: 'get',
        update: ['put','patch']
    });

    const userPermissions = await executeSqlQuery(`
        SELECT 
            role_permissions.action, 
            role_permissions.subject, 
            role_permissions.fields, 
            role_permissions.conditions,
            role_permissions.inverted,
            role_permissions.role_id
        FROM user_roles
        JOIN role_permissions ON user_roles.id = role_permissions.role_id OR role_id IS NULL
        WHERE user_roles.name = ?;
    `, [user?.role ?? 'guest']);

    var jsonPermissions = [];
    for (const permission of userPermissions) {
        var formattedConditions = null;
        if (permission.conditions) {
            const jsonConditions = JSON.parse(permission.conditions);
            for (const condition in jsonConditions) {
                if (jsonConditions[condition] === 'USER_ID') 
                    jsonConditions[condition] = user._id;
            }
            formattedConditions = jsonConditions;
        }

        jsonPermissions.push({
            action: permission.action,
            subject: permission.subject,
            fields: permission.fields,
            conditions: formattedConditions,
            inverted: permission.inverted,
        });
    }
    // console.log(jsonPermissions.filter(item => true))     // debugging
    return new Ability(jsonPermissions,{ resolveAction: aliasResolver });
}

module.exports = async function(req, res, next) {
    const user = req.user;
    const action = req.method.toLowerCase();
    const resource = req.path.split('/')[1];

    const ability = await defineUserAbilities(user);
    if (!ability.can(action, resource)) 
        return res.status(403).send('Access denied');
    req.ability = ability;

    next();
}