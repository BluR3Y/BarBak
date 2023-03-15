const path = require('path');
const { Ability, AbilityBuilder, ForbiddenError, createAliasResolver } = require('@casl/ability');

function defineUserAbilities(user = {}) {
    const { can, cannot, build } = new AbilityBuilder(Ability);

    if (user.role === 'admin') {
        can('manage', 'all');
    } else if (user.role === 'user') {
        can('delete', 'account');
        can('update', 'account');

        can('read', 'users', { _id: user._id });
        can('update', 'users', { _id: user._id });

        can('create', 'drinkware');
        can('read', 'drinkware', { user: user._id });
        can('update', 'drinkware', { user: user._id });
        can('delete', 'drinkware', { user: user._id });

        can('create', 'tools');
        can('read', 'tools', { user: user._id });
        can('update', 'tools', { user: user._id });
        can('delete', 'tools', { user: user._id });
    } else {
        can('create', 'account');
    }
    // Rules applied to any role
    can('read', 'users', { public: true });
    can('read', 'drinkware', { public: true });
    can('read', 'tools', { public: true });

    const aliasResolver = createAliasResolver({
        create: 'post',
        read: 'get',
        update: ['put','patch']
    });

    return build({ resolveAction: aliasResolver });
}

module.exports = function(req, res, next) {
    const user = req.user;
    const action = req.method.toLowerCase();
    const resource = req.path.split('/')[1];
    
    // Define the ability object based on the user's role
    const ability = defineUserAbilities(user);
    if (!ability.can(action, resource)) 
        return res.status(403).send('Access denied');
    req.ability = ability;
    next();
}