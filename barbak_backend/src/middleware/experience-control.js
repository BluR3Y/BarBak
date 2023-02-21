
exports.expertRequired = function(req, res, next) {
    console.log(req.user.experience)
    if (req.user.experience !== 'expert')
        return res.status(401).send({ path: 'experience', type: 'valid', message: 'You do not meet the qualifications for this request' });

    next();
}

exports.experiencedRequired = function(req, res, next) {
    if (req.user.experience !== 'experienced' && req.user.experience !== 'expert')
        return res.status(401).send({ path: 'experience', type: 'valid', message: 'You do not meet the qualifications for this request' })

    next();
}