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
    return userRow[0]['user_id'];
}

async function userExists(id) {
    let queryString = "SELECT COUNT(*) FROM User WHERE user_id = ?";
    let are_they_real = await db.getPool().query(queryString, id);
    return are_they_real[0]['COUNT(*)'] === 0;
}

exports.register = async function(name, email, password, city, country) {
    //checks if all the fields are there
    if (!name || !email || !password || !city || !country) {
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

    let queryString = "INSERT INTO User (name, email, await passwords.hash(password), city, country) VALUES (?,?,?,?,?)";

    try {
        let response = await db.getPool.query(queryString, [name, email, password, city, country]);
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
    } else {
        queryString = "SELECT user_id, password FROM User WHERE email = ?";
        value = [email]
    }
    try {
        let response = await db.getPool().query(queryString, value);
        if (response.length === 0) {
            return Promise.reject(new Error("Bad Request"));
        }
        if (await passwords.compare(response[0]['password'], password)) {
            let token = await uidgen.generate();
            await db.getPool.query("UPDATE User SET auth_token = ? WHERE user_id = ? ", [token, response[0]['user_id']]);
            return Promise.resolve([response, token]);
        } else {
            return Promise.reject(new Error("Bad Request"));
        }
    } catch (error) {
        return Promise.reject(error);
    }
};

exports.logout = async function(token) {
    let user = await getUser(token);
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

exports.getUser = async function(token) {
    if (!token) {
        return null;
    }
    let queryString = "SELECT user_id FROM User WHERE auth_token = ?";
    //userData will be the row of data returned from database
    let userData = await db.getPool().query(queryString, token);
    if (userData.length <= 0) {
        return null
    }
    return userData[0]['user_id'];
};

exports.changeDetails = async function(name, email, password, currentPassword, city, country, token, id) {
    ///This is a pretty disgusting function sorry bout that

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
    if (currentPasswordValidity) {
        args.push("currentPassword = ?");
        queryVals.push(currentPassword);
    }
    if (cityValidity) {
        args.push("city = ?");
        queryVals.push(city);
    }
    if (countryValidity) {
        args.push("country = ?");
        queryVals.push(country);
    }

    let updateQuery = "UPDATE User SET " + args.join(", ") + "WHERE user_id = ?";
    let checkUser = "SELECT COUNT(*) FROM User WHERE user_id = ?";
    queryVals.push(id);

    try {
        let resultUser = await db.getPool().query(checkUser, id);
        if (resultUser[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Not Found"));
        }
        if (user != parseInt(id, 10)) {
            return Promise.reject(new Error("Forbidden"));
        }
        let result = await db.getPool().query(updateQuery, queryVals);
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

    if (!token) {
        return Promise.reject(new Error("Not Found"));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let queryString = "SELECT photo_filename FROM Petition WHERE petition_id = ?";
    try {
        let checkPhotoQuery = await db.getPool().query(queryString, id);
        let filename = checkPhotoQuery[0]['photo_filename'];
        if (!filename) {
            return Promise.reject(new Error("Not Found"));
        }
        let photo = await fs.readFile('storage/photos/' + filename);
        return Promise.resolve(photo);
    } catch (error) {
        return Promise.reject(error);
    }
};

exports.setUserPhoto = async function(id, token, imageRequestBody) {

    if (!token) { return Promise.reject(new Error("Not Found"));}
    let user = await getUser(token);
    if (!user) { return Promise.reject(new Error("Unauthorized"));}
    if (user !== parseInt(id, 10)) { return Promise.reject(new Error("Forbidden")); }
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