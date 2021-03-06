const users = require('../controllers/users.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/register')
        .post(users.register);

    app.route(app.rootUrl + '/users/login')
        .post(users.login);

    app.route(app.rootUrl + '/users/logout')
        .post(users.logout);

    app.route(app.rootUrl + '/users/:id')
        .get(users.getUser)
        .patch(users.changeDetails);

    app.route(app.rootUrl + '/users/')
        .get(users.getUser)
        .patch(users.changeDetails);

    app.route(app.rootUrl + '/users/:id/photo')
        .get(users.getUserPhoto)
        .put(users.setUserPhoto)
        .delete(users.deleteUserPhoto);

};