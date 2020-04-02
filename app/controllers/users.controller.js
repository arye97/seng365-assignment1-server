const Users = require('../models/users.model');

exports.register = async function (req, res) {
    try {
        await Users.register(req.body.name, req.body.email, req.body.password, req.body.city, req.body.country)
            .then((response) => {
                let userInfo = {
                    "userId": response['insertId']
                };
                res.statusMessage = 'Created';
                res.status(201).json(userInfo);
            });
    } catch (error) {
        if (error.message === 'Bad Request') {
            res.statusMessage = 'Bad Request';
            res.status(400).send('Bad Request');
        } else {
            console.error(error);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
};

exports.login = async function(req, res) {
    //get login model
    try {
        await Users.login(req.body.username, req.body.email, req.body.password)
            .then(response => {
                let userResponse= {
                    "userId": response[0][0]['user_id'],
                    "token": response[1]
                };
                res.statusMessage = 'OK';
                res.status(201).send();
                res.json(userResponse);
            })
    } catch (error) {
        if (error.message === 'Bad Request') {
            res.statusMessage = 'Bad Request';
            res.status(400).send('Bad Request');
        } else {
            console.error(error);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
};