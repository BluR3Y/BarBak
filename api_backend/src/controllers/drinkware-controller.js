
module.exports.search = async (req, res) => {
    const data = req.query;
    console.log(data);

    res.send('Hello');
}