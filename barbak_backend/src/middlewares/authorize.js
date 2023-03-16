const path = require('path');
const { Ability, AbilityBuilder, ForbiddenError, createAliasResolver } = require('@casl/ability');

function defineUserAbilities(user = {}) {
    const { can, cannot, build } = new AbilityBuilder(Ability);

    if (user.role === 'admin') {
        can('manage', 'all');
    } else if (user.role === 'editor') {
        // Create Content
        can('create', 'content');

        // Modify Verified Content
        can('update', 'drinkware', { model: 'Verified Drinkware' });
        can('delete', 'drinkware', { model: 'Verified Drinkware' });

        can('update', 'tools', { model: 'Verified Tool' });
        can('delete', 'tools', { model: 'Verified Tool' });

        // Modify Public User Content
        can('update', 'drinkware', { model: 'User Drinkware', public: true });
        can('delete', 'drinkware', { model: 'User Drinkware', public: true });
    } else if (user.role === 'user') {
        can('delete', 'account');
        can('update', 'account');

        can('read', 'users', { _id: user._id });
        can('update', 'users', { _id: user._id });

        can('create', 'drinkware');
        can('read', 'drinkware', { model: 'User Drinkware', user: user._id });
        can('update', 'drinkware', { model: 'User Drinkware', user: user._id });
        can('delete', 'drinkware', { model: 'User Drinkware', user: user._id });

        can('create', 'tools');
        can('read', 'tools', { model: 'User Tool', user: user._id });
        can('update', 'tools', { model: 'User Tool', user: user._id });
        can('delete', 'tools', { model: 'User Tool', user: user._id });
    } else {
        can('create', 'account');
    }
    // Rules applied to any role
    can('read', 'users', { public: true });
    can('read', 'drinkware', { model: 'User Drinkware', public: true });
    can('read', 'tools', { model: 'User Tool', public: true });

    can('read', 'drinkware', { model: 'Verified Drinkware' });
    can('read', 'tools', { model: 'Verified Drinkware' });
    
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