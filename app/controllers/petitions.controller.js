const Petitions = require('../models/petitions.model');

exports.viewAllPetitions = async function (req, res) {

    await Petitions.viewAllPetitions(req.query.startIndex, req.query.count, req.query.q, req.query.categoryId, req.query.authorId, req.query.sortBy)
        .then((rows) => {
                let petitionRows = rows[0];
                let petitions = [];
                if (petitionRows) {
                    for (let i = 0; i < petitionRows.length; i++) {
                        petitions.push(
                            /*
                            [
                              {
                                "petitionId": 1,
                                "title": "Increase the education budget",
                                "category": "Animals",
                                "authorName": "Adam Anderson",
                                "signatureCount": 42
                              }
                            ]
                             */
                            {
                                "petitionId" : petitionRows[i]['petition_id'],
                                "title" : petitionRows[i]['title'],
                                "category" : {
                                    "categoryId" : petitionRows[i]['category_id'],
                                    "categoryName" : petitionRows[i]['category_name']
                                },
                                "author" : {
                                    "author_id" : petitionRows[i]['author_id'],
                                    "authorName" : petitionRows[i]['name']
                                },
                                "signatureCount" : petitionRows[i]['signature_count']
                            }
                        )
                    }
                }
                res.statusMessage = 'OK';
                res.status(200);
                res.json(petitions);
            }, (error) => {
                if (error.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }).catch(
                (error) => {
                    console.error(error);
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                }
        );
};

exports.viewPetition = async function (req, res) {
    await Petitions.getOnePetition(req.params.id)
        .then((petitionRows) => {
            let petitionParaData = {

                "petitionId" : petitionRows[0]['petition_id'],
                "title" : petitionRows[0]['title'],
                "category" : petitionRows[0]['category_name'],
                "authorName" : petitionRows[0]['author_name'],
                "signatureCount" : petitionRows[0]['signature_count'],
                "description" : petitionRows[0]['description'],
                "authorId" : petitionRows[0]['author_id'],
                "authorCity" : petitionRows[0]['city'],
                "authorCountry" : petitionRows[0]['country'],
                "createdDate" : petitionRows[0]['created_date'],
                "closingDate" : petitionRows[0]['closing_date']
            };
            res.statusMessage = 'OK';
            res.status(200);
            res.json(petitionParaData);
        },
            (error) => {
                if (error.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Petition: ' + req.params.id + ' Not Found');
                } else {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }).catch((error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );

};


exports.deletePetition = async function (req, res) {
    await Petitions.removePetition(req.params.id, req.headers['x-authorization'])
        .then((result) => {
            res.statusMessage = 'OK';
            res.status(200);
            res.send('Deleted');
        },
            (error) => {
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
        }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

exports.setHeroPhoto = async function (req, res) {
    let photoBody = Buffer.from(req.body);
    await Petitions.setPetitionHeroImage(req.params.id, req.headers['x-authorization'], photoBody)
        .then((result) => {
                res.statusMessage = 'OK';
                res.status(200);
                res.send('OK');
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

exports.getHeroPhoto = async function (req, res) {
    let filename = req.params.photoFilename;
    let contentType;
    if (filename.includes('jpg') || (filename.includes('jpeg'))) {
        contentType = 'image/jpeg';
    } else if (filename.includes('png')) {
        contentType = 'image/png';
    } else {
        res.statusMessage = 'Not Found';
        res.status(404).send('Photo: ' + filename + ' Not Found');
    }
    await Petitions.getPetitionHeroImage(req.params.id, req.headers['x-authorization'], filename)
        .then((photo) => {
            res.statusMessage = 'OK';
            res.contentType(contentType);
            res.status(200);
            res.send(photo);
        }, (error) => {
            if (error.message === 'Not Found') {
                res.statusMessage = 'Not Found';
                res.status(404).send('Photo: ' + req.params.photoFilename + ' Not Found');
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

exports.getSignature = async function (req, res) {
    await Petitions.getPetitionSignatures(req.params.id)
        .then((signatures) => {
            /*
              {
                "signatoryId": 11,
                "name": "Adam Anderson",
                "city": "Christchurch",
                "country": "New Zealand",
                "signedDate": "2012-04-23T18:25:43.511Z"
              }
             */
            let signatureData = {
                "signatoryId" : signatures[0]['signatory_id'],
                "name" : signatures[0]['name'],
                "city" : signatures[0]['city'],
                "country" : signatures[0]['country'],
                "signedDate" : signatures[0]['signed_date']
            };
            res.statusMessage = 'OK';
            res.status(200).send(signatureData);
        },
            (error) => {
                if (error.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
                } else {
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }).catch(
                (error) => {
                    console.log(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
        );
};

exports.signPetition = async function (req, res) {
    await Petitions.signPetition(req.params.id, req.headers['x-authorization'])
        .then((result) => {
            res.statusMessage = 'Created';
            res.status(201);
            res.send('Created');
        },
            (error) => {
            if (error.message === 'Forbidden') {
                res.statusMessage = 'Forbidden';
                res.status(403).send('Forbidden');
            } else if (error.message === 'Not Found') {
                res.statusMessage = 'Not Found';
                res.status(404).send('Not Found');
            } else if (error.message === 'Bad Request') {
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            } else if (error.message === 'Unauthorized') {
                res.statusMessage = 'Unauthorized';
                res.status(401).send('Unauthorized');
            } else {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        )
};

exports.deleteSignature = async function (req, res) {
    await Petitions.removeSignature(req.params.id, req.headers['x-authorization'])
        .then((result) => {
            res.statusMessage = 'OK';
            res.status(200).send('OK');
        }, (error) => {
            if (error.message === 'Unauthorized') {
                res.statusMessage = 'Unauthorized';
                res.status(401).send('Unauthorized');
            }  else if (error.message === 'Forbidden') {
                res.statusMessage = 'Forbidden';
                res.status(403).send('Forbidden');
            }  else if (error.message === 'Bad Request') {
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            }   else if (error.message === 'Not Found') {
                res.statusMessage = 'Not Found';
                res.status(404).send('Not Found');
            } else {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        }).catch((error) => {
            res.statusMessage = 'Internal Server Error';
            res.status(500).send('Internal Server Error');
        })
};

exports.getCategories = async function (req, res) {
    await Petitions.getAllCategories()
        .then((categoryRows) => {
                let categories = [];
                if (categoryRows) {
                    for (let i = 0; i < categoryRows.length; i++) {
                        categories.push(
                            {
                                "categoryId" : categoryRows[i]['category_id'],
                                "name" : categoryRows[i]['category_name']
                            }
                        )
                    }
                }
                res.statusMessage = 'OK';
                res.status(200);
                res.json(categories);
            },
            (error) => {
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        ).catch(
            (error) => {
                console.log(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

exports.addPetition = async function (req, res) {
    let petitionBody = req.body;
    await Petitions.addNewPetition(petitionBody, req.headers['x-authorization'])
        .then((result) => {
            let petitionData = {
                "petitionId" : result['petition_Id']
            };
            res.statusMessage = 'Created';
            res.status(201);
            res.json(petitionData);
        },
            (error) => {
                if (error.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else if (error.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                } else {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }).catch(
                (error) => {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
        );
};

exports.changeDetails = async function (req, res) {
    let petitionBody = req.body;

    await Petitions.changePetition(petitionBody, id, req.headers['x-authorization'])
        .then((result) => {
            res.statusMessage = 'OK';
            res.status(200);
            res.send('Petition details updated');
        },
        (error) => {
            if (error.message === 'Forbidden') {
                res.statusMessage = 'Forbidden';
                res.status(403).send('Forbidden');
            } else if (error.message === 'Not Found') {
                res.statusMessage = 'Not Found';
                res.status(404).send('Not Found');
            } else if (error.message === 'Bad Request') {
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            } else if (error.message === 'Unauthorized') {
                res.statusMessage = 'Unauthorized';
                res.status(401).send('Unauthorized');
            } else {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

