const backdoor = require('../controllers/backdoor.controller');

module.exports = function (app) {

    //// FOR THE BACKDOOR ENDPOINT ////
    app.route(app.rootUrl + '/reset')
        .post(backdoor.resetDb);

    app.route(app.rootUrl + '/resample')
        .post(backdoor.resample);

    app.route(app.rootUrl + '/reload')
        .post(backdoor.reload);

    app.route(app.rootUrl + '/executeSql')
        .post(backdoor.executeSql);

};
