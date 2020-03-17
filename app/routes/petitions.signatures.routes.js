const petitions_signatures = require('../controllers/petitions.signatures.controller');

module.exports = function (app) {

    app.route(app.rootUrl + '/petitions/:id/signatures')
        .get(petitions_signatures.getSignature);

    app.route(app.rootUrl + '/petitions/:id/signatures')
        .put(petitions_signatures.signPetition);

    app.route(app.rootUrl + '/petitions/:id/signatures')
        .delete(petitions_signatures.removeSignature);
};