const { Ability, createAliasResolver } = require('@casl/ability');
const { executeSqlQuery } = require('../config/database-config');

async function defineUserAbilities(user) {
    const aliasResolver = createAliasResolver({
        create: 'post',
        read: 'get',
        update: ['put','patch']
    });

    const {role_id} = await executeSqlQuery('SELECT id AS role_id FROM user_roles WHERE name = ? LIMIT 1;', [user ? user.role : 'guest'])
        .then(res => res[0] ?? res);
    const userPermissions = await executeSqlQuery('SELECT * FROM role_permissions WHERE role_id = ? OR role_id IS NULL;', [role_id]);
    
    var jsonPermissions = [];
    for (const permission of userPermissions) {
        var formattedConditions = null;
        if (permission.conditions) {
            formattedConditions = JSON.parse(permission.conditions.replace('USER_ID', (match, key) => {
                return JSON.stringify(user._id);
            }));
        }

        jsonPermissions.push({
            action: permission.action,
            subject: permission.subject,
            fields: permission.fields,
            conditions: formattedConditions,
            inverted: permission.inverted,
        });
    }
    console.log(jsonPermissions)
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