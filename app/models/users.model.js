const db = require('../../config/db');
const fs = require('mz/fs');
const passwords = require('../../config/passwords');
const emailValidator = require('email-validator');
const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator();
const fileType = require('file-type');

/*
T0-DO ->
post - register
post - login
post - logout
get - getUser
patch - changeDetails
 */

async function getUser(token) {
    // Checking the token is present
    if (!token) {
        return null;
    }
    // Querying for the user
    let queryString = "SELECT user_id FROM User WHERE auth_token = ?";
    let userRow = await db.getPool().query(queryString, token);
    if (userRow.length < 1) {
        // Returning null as no user was returned
        return null;
    }
    // Returning the user id
    return userRow[0][0]['user_id'];
}

async function userExists(id) {
    let queryString = "SELECT COUNT(*) FROM User WHERE user_id = ?";
    let are_they_real = await db.getPool().query(queryString, id);
    console.log(are_they_real[0][0]['COUNT(*)']);
    return are_they_real[0][0]['COUNT(*)'] !== 0;
}

exports.register = async function(name, email, password, city, country) {
    //checks if all the fields are there
    if (!name || !email || !password) {
        return Promise.reject(new Error("Bad Request"));
    }
    //checks if the password is long enough, ie > 1
    if (password.length === 0) {
        return Promise.reject(new Error("Bad Request"));
    }
    //checks if the email is a valid email type
    if (!emailValidator.validate(email)) {
        return Promise.reject(new Error("Bad Request"));
    }
    let hashed_password = await passwords.hash(password);
    let values = [name, email, hashed_password];

    let queryString = `INSERT INTO User (name, email, password`;
    let valuesQuery = `) VALUES (?, ?, ?`;

    if (city !== undefined) {
        values.push(city.toString());
        queryString += ', city';
        valuesQuery += ', ?';
    }
    if (country !== undefined) {
        values.push(country.toString());
        queryString += ', country';
        valuesQuery += ', ?';
    }

    valuesQuery += ')';

    queryString += valuesQuery;
    try {
        let response = await db.getPool().query(queryString, values);
        return Promise.resolve(response);
    } catch (error) {
        return Promise.reject(error);
    }

};

exports.login = async function(email, password) {



    let queryString;
    let value = [];
    if (!email || !password) {
        return Promise.reject(new Error("Bad Request"));
    }
    ///check email exists
    let checkEmailQuery = "SELECT COUNT(*) FROM User WHERE email = ?";
    let emailCheck = await db.getPool().query(checkEmailQuery, email);
    emailCheck = emailCheck[0][0]['COUNT(*)'];
    if (emailCheck === 0) {
        return Promise.reject(new Error("Bad Request"));
    }
    queryString = "SELECT user_id, password FROM User WHERE email = ?";
    value = [email]
    try {
        let response = await db.getPool().query(queryString, value);
        if (response.length === 0) {
            return Promise.reject(new Error("Bad Request"));
        }
        if (await passwords.compare(response[0][0]['password'], password)) {
            let token = await uidgen.generate();
            await db.getPool().query("UPDATE User SET auth_token = ? WHERE user_id = ? ", [token, response[0][0]['user_id']]);
            let toReturn = [response[0][0]['user_id'], token];
            console.log(toReturn);
            return Promise.resolve(toReturn);
        } else {
            return Promise.reject(new Error("Bad Request"));
        }
    } catch (error) {
        return Promise.reject(error);
    }
};

exports.logout = async function(token) {

    //Check the user will actually be created
    let checkTokenQuery = "SELECT COUNT(*) FROM User WHERE auth_token = ?";
    let checkToken = await db.getPool().query(checkTokenQuery, token);
    checkToken = checkToken[0][0]['COUNT(*)'];
    if (checkToken === 0) {
        return Promise.reject(new Error("Unauthorized"));
    }

    //continue
    let user = await getUser(token);
    console.log(user);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let updateQuery = "UPDATE User SET auth_token = null WHERE user_id = ?";
    try {
        let result = await db.getPool().query(updateQuery, user);
        return Promise.resolve(result);
    } catch(error) {
        return Promise.reject(error);
    }
};

exports.getUserData = async function(id, token) {
    ////cover the get 'me' endpoint

    let exists = await userExists(id);
    console.log(exists);
    if (!exists) {
        return Promise.reject(new Error('Not Found'));
    }

    let user_tokenString = "SELECT auth_token FROM User WHERE user_id = ?";
    let queryString = "SELECT name, city, country";
    let user_token = await db.getPool().query(user_tokenString, id);
    if (user_token[0][0]['auth_token'] === token) {
        queryString += ', email';
    }
    let valueString = " FROM User WHERE user_id = ?";
    queryString += valueString;
    //userData will be the row of data returned from database
    try{
        let userData = await db.getPool().query(queryString, id);

        if (userData.length === 0) {
            return Promise.reject(new Error('Not Found'));
        }
        return Promise.resolve(userData);
    } catch(error) {
        // Rejecting promise as an error was thrown
        return Promise.reject(error);
    }

};

exports.changeDetails = async function(name, email, password, currentPassword, city, country, token, id) {
    ///This is a pretty disgusting function sorry bout that


    if (!token) {
        return Promise.reject(new Error("Unauthorized"));
    }

    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"))
    }
    if (name !== undefined && name.length < 1) {
        return Promise.reject(new Error("Bad Request"))
    }
    if (email !== undefined && email.length < 1 ){
        return Promise.reject(new Error("Bad Request"))
    }
    if (password !== undefined && (password.length < 1 || (typeof password) !== "string")) {
        return Promise.reject(new Error("Bad Request"))
    }
    if (currentPassword !== undefined && (currentPassword.length < 1 || (typeof currentPassword) !== "string")) {
        return Promise.reject(new Error("Bad Request"))
    }
    if (city !== undefined && city.length < 1 ){
        return Promise.reject(new Error("Bad Request"))
    }
    if (country !== undefined && country.length < 1 ){
        return Promise.reject(new Error("Bad Request"))
    }

    let nameValidity = true;
    let emailValidity = true;
    let passwordValidity = true;
    let currentPasswordValidity = true;
    let cityValidity = true;
    let countryValidity = true;

    if (!name) {nameValidity = false;}
    if (!email) {emailValidity = false;}
    if (!password) {passwordValidity = false;}
    if (!currentPassword) {currentPasswordValidity = false;}
    if (!city) {cityValidity = false;}
    if (!country) {countryValidity = false;}

    if (!nameValidity && !emailValidity && !passwordValidity && !currentPasswordValidity && !cityValidity && !countryValidity) {
        return Promise.reject(new Error("Bad Request"));
    }

    let args = [];
    let queryVals = [];
    if (nameValidity) {
        args.push("name = ?");
        queryVals.push(name);
    }
    if (emailValidity) {
        args.push("email = ?");
        queryVals.push(email);
    }
    if (passwordValidity) {
        args.push("password = ?");
        queryVals.push(password);
    }
    if (cityValidity) {
        args.push("city = ?");
        queryVals.push(city);
    }
    if (countryValidity) {
        args.push("country = ?");
        queryVals.push(country);
    }


    //Check the current_password is equal to preset password
    let passwordQuery = "SELECT password FROM User WHERE user_id = ?";
    try {
        let passwordCheck = await db.getPool().query(passwordQuery, user);
        console.log(passwordCheck);
        if (!await passwords.compare(passwordCheck, currentPassword)) {
            return Promise.reject(new Error("Bad Request"));
        }
    } catch (error) {
        console.error(error);
    }

    let updateQuery = "UPDATE User SET " + args.join(", ") + " WHERE user_id = ?";
    console.log(updateQuery);
    let checkUser = "SELECT COUNT(*) FROM User WHERE user_id = ?";
    queryVals.push(user);
    console.log(checkUser);
    try {
        console.log(user);
        let resultUser = await db.getPool().query(checkUser, user);
        console.log("checkUser Worked");
        if (resultUser[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Not Found"));
        }
        if (user != parseInt(user, 10)) {
            return Promise.reject(new Error("Forbidden"));
        }
        let result = await db.getPool().query(updateQuery, queryVals);
        console.log("updateQuery worked");
        return Promise.resolve(result);
    } catch(err) {
        return Promise.reject(err);
    }
};



/// Users - Photos
/*
Need
getUserPhoto
setUserPhoto
deleteUserPhoto
 */

exports.getUserPhoto = async function(id, token) {
    let user;
    let isNull = false;
    if (id === null || id === undefined || id === 'null') {
        isNull = true;
        if (!token) {
            return Promise.reject(new Error('Unauthorized'));
        }
        user = await getUser(token);
        if (!user) {
            return Promise.reject(new Error('Not Found'));
        }
    }

    let queryString = "SELECT photo_filename FROM User WHERE user_id = ?";
    try {
        let checkPhotoQuery;
        if (isNull === false) {
            checkPhotoQuery = await db.getPool().query(queryString, id);
        } else {
            checkPhotoQuery = await db.getPool().query(queryString, user);
        }
        let filename = checkPhotoQuery[0][0]['photo_filename'];
        if (!filename) {
            return Promise.reject(new Error("Not Found"));
        }
        let photo = await fs.readFile('storage/photos/' + filename);
        return Promise.resolve(photo);
    } catch (error) {
        console.error(error);
        return Promise.reject(error);
    }
};

exports.setUserPhoto = async function(id, token, imageRequestBody) {

    console.log(id, token);
    if (!token) { return Promise.reject(new Error("Not Found"));}
    let user = await getUser(token);
    if (!user) { return Promise.reject(new Error("Unauthorized"));}
    if (user !== parseInt(id, 10)) { return Promise.reject(new Error("Forbidden")); }

    //check if a user doesnt already have a photo


    let filename = "petition" + id + fileType(imageRequestBody)['ext'];
    let checkPhotoQuery = "SELECT photo_filename FROM User WHERE user_id = ?";
    let updateQuery = "UPDATE User SET photo_filename = ? WHERE user_id = ?";

    try {
        let code = 200;
        let checkPhoto = await db.getPool().query(checkPhotoQuery, [id, user]);
        if (!checkPhoto[0]['photo_filename']) {
            code = 201;
        } else {
            await fs.unlink("storage/photos/" + checkPhoto[0]['photo_filename']);
        }

        await fs.mkdir('storage/photos/', {recursive: true}).then(
            {}, (error) => {
                if (error.code !== 'EEXIST') {
                    return Promise.reject(error);
                }
            });
        ///Write the file local storage
        await fs.writeFile("storage/photos/" + filename, imageRequestBody);
        ///Save the file to the database
        await db.getPool().query(updateQuery, [filename, id]);
        return Promise.resolve(code);
    } catch(error) {
        return Promise.reject(error);
    }
};

exports.deleteUserPhoto = async function(id, token) {
    if (!token) {
        return Promise.reject(new Error("Not Found"));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    if (user !== parseInt(id, 10)) {
        return Promise.reject(new Error("Forbidden"));
    }
    let queryString = "SELECT photo_filename FROM User WHERE user_id = ?";
    let deletePhotoQuery = "UPDATE User SET photo_filename = NULL WHERE user_id = ?";

    try {
        let getPhoto = await db.getPool().query(queryString, id);
        if (!getPhoto[0]['photo_filename']) {
            return Promise.reject(new Error("Not Found"));
        }
        await fs.unlink("storage/photos/" + getPhoto[0]['photo_filename']);
        let deletePhoto = await db.getPool().query(deletePhotoQuery, id);
        return Promise.resolve(deletePhoto);
    } catch (error) {
        return Promise.reject(error)
    }
};