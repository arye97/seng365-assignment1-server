const petitions = require('../controllers/petitions.controller');
//// FOR THE PETITIONS ENDPOINT ////

module.exports = function (app) {
    app.route(app.rootUrl + '/petitions')
        .get(petitions.view);

    app.route(app.rootUrl + '/petitions')
        .post(petitions.add);

    app.route(app.rootUrl + '/petitions/id')
        .get(petitions.info);

    app.route(app.rootUrl + '/petitions/:id')
        .patch(petitions.change);

    app.route(app.rootUrl + '/petitions/:id')
        .delete(petitions.remove);

    app.route(app.rootUrl + '/petitions/categories')
        .get(petitions.categories);
};