const Petitions = require('../models/petitions.model');
exports.view = async function (req, res) {
    try {
        const petition = await Petitions.view(req.params.id);
        if (petition) {
            res.statusMessage = "OK";
            res.status(200)
                .json(petition);
        } else {
            res.statusMessage = "Not Found";
            res.status(404)
                .send();
        }
    } catch (error) {
        console.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send();
    }
};