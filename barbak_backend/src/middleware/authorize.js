const { AppRole } = require('../models/roles-model');
const { Ability, createAliasResolver, ForbiddenError } = require('@casl/ability');
const AppError = require('../utils/app-error');

async function defineUserAbilities(user) {
    const aliasResolver = createAliasResolver({
        create: 'post',
        read: 'get',
        update: ['put','patch']
    });
    ForbiddenError.setDefaultMessage('Unauthorized request');
    
    const userRole = await AppRole.findOne({
        ...(user ? { _id: user.role } : { name: 'guest' })
    });
    const userPermissions = JSON.parse(JSON.stringify(userRole.permissions).replace(/"USER_ID"/g, `"${user?._id}"`));

    return new Ability(userPermissions, { resolveAction: aliasResolver });
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