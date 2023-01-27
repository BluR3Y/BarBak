const Drinkware = require('../models/drinkware-model');
const uploads = require('../utils/uploads');

module.exports.create = async (req, res) => {
    const { name, description, material } = req.body;
    // const drinkwareImage = req.file;

    if(await Drinkware.findOne({ name, user: req.user })) 
        return res.status(400).send({ path: 'drinkware', type: 'exist' });

    try {

        // last here
        await Drinkware.create({
            name,
            description,
            material,
            image: filename,
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