const Users = require('../models/users.model');
const fileType = require('file-type');
const fs = require('fs');

exports.register = async function (req, res) {
    await Users.register(req.body.name, req.body.email, req.body.password, req.body.city, req.body.country)
        .then((result) => {
            let userDetails = {
                "userId": result[0]['insertId']
            };
            res.statusMessage = 'Created';
            res.status(201).json(userDetails);
        }, (error) => {
            if (error.message === 'Bad Request' || error.code === 'ER_DUP_ENTRY') {
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            } else {
                console.log(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        }).catch (
            (error) => {
                console.log(error);
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            }
        );

};

exports.login = async function(req, res) {
    // Calling model method to log the user in
    await Users.login(req.body.email, req.body.password)
        .then((result) => {
                // Forming json response
                console.log(result);
                let userData = {
                    "userId": result[0],
                    "token": result[1]
                };
                // Sending the response
                res.statusMessage = 'OK';
                res.status(200);
                res.json(userData);
            }, (err) => {
                // Handling errors
                if (err.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else {
                    console.error(err);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            }
        );
};

exports.logout = async function(req, res) {
    // Calling model method to log the user out
    await Users.logout(req.headers['x-authorization'])
        .then((result) => {
                // Sending response
                res.statusMessage = 'OK';
                res.status(200).send();
            }, (err) => {
                // Handling errors
                if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                } else {
                    console.error(err);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

exports.getUser = async function (req, res) {
    await Users.getUserData(+req.params.id, req.headers['x-authorization'])
        .then((result) => {
                let userDetails;
                if (result[1][3]) {
                    userDetails = {
                        "name" : result[0][0]['name'],
                        "city" : result[0][0]['city'],
                        "country" : result[0][0]['country'],
                        "email" : result[0][0]['email']
                    };
                } else {
                    userDetails = {
                        "name": result[0][0]['name'],
                        "city": result[0][0]['city'],
                        "country": result[0][0]['country']
                    }
                }
                res.statusMessage = 'OK';
                res.json(userDetails);
            },
            (error) => {
                if (error.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('User: ' + req.params.id + ' Not Found');
                } else {
                    console.log(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

exports.changeDetails = async function (req, res) {

    await Users.changeDetails(req.body.name, req.body.email, req.body.password, req.body.currentPassword, req.body.city, req.body.country, req.headers['x-authorization'], req.params.id)
        .then((result) => {
            res.statusMessage = 'OK';
            res.status(200).send('User Updated');
        },
        (error) => {
            if (error.message === 'Bad Request' || error.code === 'ER_DUP_ENTRY') {
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            } else if (error.message === 'Unauthorized') {
                res.statusMessage = 'Unauthorized';
                res.status(401).send('Unauthorized');
            } else if (error.message === 'Forbidden') {
                res.statusMessage = 'Forbidden';
                res.status(403).send('Forbidden');
            } else if (error.message === 'Not Found') {
                res.statusMessage = 'Not Found';
                res.status(404).send('Not Found');
            } else {
                console.log(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        }
    ).catch(
            (error) => {
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

exports.getUserPhoto = async function (req, res) {
    await Users.getUserPhoto(req.params.id, req.headers['x-authorization'])
        .then((photo) => {
            res.statusMessage = 'OK';
            res.contentType(fileType(photo)['ext']);
            res.status(200).send(photo);
        },
            (error) => {
                console.error(error);
                if (error.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
                } else {
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

exports.setUserPhoto = async function (req, res) {
  let photoBody = Buffer.from(req.body);
  await Users.setUserPhoto(req.params.id, req.headers['x-authorisation'], photoBody)
      .then((code) => {
          res.status(201);
          res.sendStatus(code);
          },
          (error) => {
              if (error.message === 'Bad Request') {
                  res.statusMessage = 'Bad Request';
                  res.status(400).send('Bad Request');
              } else if (error.message === 'Unauthorized') {
                  res.statusMessage = 'Unauthorized';
                  res.status(401).send('Unauthorized');
              } else if (error.message === 'Forbidden') {
                  res.statusMessage = 'Forbidden';
                  res.status(403).send('Forbidden');
              } else if (error.message === 'Not Found') {
                  res.statusMessage = 'Not Found';
                  res.status(404).send('Not Found');
              } else {
                  res.statusMessage = 'Internal Server Error';
                  res.status(500).send('Internal Server Error');
              }
          }
      ).catch(
          (error) => {
              res.statusMessage = 'Internal Server Error';
              res.status(500).send('Internal Server Error');
          }
      );
};

exports.deleteUserPhoto = async function (req, res) {
    await Users.deleteUserPhoto(req.params.id, req.headers['x-authorisation'])
        .then(() => {
                res.statusMessage = 'OK';
                res.status(200).send('OK');
            }, (error) => {
                if (error.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                } else if (error.message === 'Forbidden') {
                    res.statusMessage = 'Forbidden';
                    res.status(403).send('Forbidden');
                } else if (error.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else if (error.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
                } else {
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                console.log(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

