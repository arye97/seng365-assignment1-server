const petitions_photos = require('../controllers/petitions.photos.controller');

module.exports = function (app) {

    app.route(app.rootUrl + '/petitions/:id/photo')
        .get(petitions_photos.getHeroImage);

    app.route(app.rootUrl + '/petitions/:id/photo')
        .put(petitions_photos.setHeroImage);
};