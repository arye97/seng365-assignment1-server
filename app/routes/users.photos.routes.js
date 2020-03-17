const users_photos = require('../controllers/users.photos.controller');

module.exports = function (app) {
    app.root(app.rootUrl + '/users/:id/photo')
        .get(users_photos.getProfilePhoto);

    app.root(app.rootUrl + '/users/:id/photo')
        .put(users_photos.setProfilePhoto);

    app.root(app.rootUrl + '/users/:id/photo')
        .delete(users_photos.deleteProfilePhoto);
};