const Drinkware = require('../models/drinkware-model');
const drinkwareValidators = require('../validators/drinkware-validators');

module.exports.create_drinkware = async (req, res) => {
    const validation = drinkwareValidators.create_drinkware_validator(req.body);

    if(validation.error) {
        const { path, type } = validation.error.details[0];
        return res.status(400).send({ path: path[0], type });
    }
    const { name, description } = validation.value;

    if(await Drinkware.findOne({ user: req.user, name })) 
        return res.status(400).send({ path: 'drinkware', type: 'exists' });

    try {
        await Drinkware.create({
            name,
            description,
            user: req.user,
            visibility: 'private'
        });
        res.status(204).send();
    } catch(err) {
        res.status(500).send(err);
    }
}