const petitions = require('../controllers/petitions.controller');
//// FOR THE PETITIONS ENDPOINT ////

module.exports = function (app) {
    app.route(app.rootUrl + '/petitions')
        .get(petitions.view)
        .post(petitions.add);

    app.route(app.rootUrl + '/petitions/id')
        .get(petitions.info)
        .patch(petitions.change)
        .delete(petitions.remove);

    app.route(app.rootUrl + '/petitions/categories')
        .get(petitions.categories);

    app.route(app.rootUrl + '/petitions/:id/photo')
        .get(petitions.getHeroImage)
        .put(petitions.setHeroImage);

    app.route(app.rootUrl + '/petitions/:id/signatures')
        .get(petitions.getSignature)
        .put(petitions.signPetition)
        .delete(petitions.removeSignature);
};