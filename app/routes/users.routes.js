const users = require('../controllers/users.controller');

module.exports = function (app) {

    app.route(app.rootURL + '/users/register')
        .post(users.register);

    app.route(app.rootURL + '/users/login')
        .post(users.login);

    app.route(app.rootURL + '/users/logout')
        .post(users.logout);

    app.route(app.rootUrl + '/users/:id')
        .get(users.getData);

    app.route(app.rootURL + '/users/:id')
        .patch(users.changeDetails);

    app.root(app.rootUrl + '/users/:id/photo')
        .get(users.getProfilePhoto)
        .put(users.setProfilePhoto)
        .delete(users.deleteProfilePhoto);

};