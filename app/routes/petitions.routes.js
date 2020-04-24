const petitions = require('../controllers/petitions.controller');
//// FOR THE PETITIONS ENDPOINT ////

module.exports = function (app) {
    app.route(app.rootUrl + '/petitions/categories')
        .get(petitions.getCategories);

    app.route(app.rootUrl + '/petitions/:id')
        .patch(petitions.changeDetails)
        .get(petitions.viewPetition)
        .delete(petitions.deletePetition);

    app.route(app.rootUrl + '/petitions')
        .get(petitions.viewAllDetailedPetitions)
        .post(petitions.addPetition);

    app.route(app.rootUrl + '/petitions/:id/photo')
        .get(petitions.getHeroPhoto)
        .put(petitions.setHeroPhoto);

    app.route(app.rootUrl + '/petitions/:id/signatures')
        .get(petitions.getSignature)
        .put(petitions.signPetition)
        .delete(petitions.deleteSignature);
};