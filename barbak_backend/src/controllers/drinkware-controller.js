const Drinkware = require('../models/drinkware-model');

// module.exports.create_drinkware = async (req, res) => {
//     const validation = Drinkware.createDrinkwareValidator(req.body);

//     if(validation.error) {
//         const { path, type } = validation.error.details[0];
//         return res.status(400).send({ path: path[0], type });
//     }
//     const { name, description } = validation.value;

//     if(await Drinkware.findOne({ user: req.user, name })) 
//         return res.status(400).send({ path: 'drinkware', type: 'exists' });

//     try {
//         await Drinkware.create({
//             name,
//             description,
//             user: req.user,
//             visibility: 'private'
//         });
//         res.status(204).send();
//     } catch(err) {
//         res.status(500).send(err);
//     }
// }

// module.exports.search_drinkware = async (req, res) => {
//     const validation = Drinkware.searchDrinkwareValidator(req.body);

//     if(validation.error) {
//         const { path, type } = validation.error.details[0];
//         return res.status(400).send({ path: path[0], type });
//     }
//     const { searchQuery } = validation.value;

//     try {
//         const search = await Drinkware.find({ name: {$regex : searchQuery}, user: req.user }, ['_id', 'name']);
//         res.status(200).send(search);
//     } catch(err) {
//         res.status(500).send(err);
//     }
// }

module.exports.create = async (req, res) => {
    const { name, description } = req.body;

    if(await Drinkware.findOne({ name, user: req.user })) 
        return res.status(400).send({ path: 'drinkware', type: 'exist' });
    
    try {
        await Drinkware.create({
            name,
            description,
            user: req.user,
            visibility: 'private'
        });
    } catch(err) {
        return res.status(500).send(err);
    }
    res.status(204).send();
}

module.exports.publicize = async (req, res) => {
    
}