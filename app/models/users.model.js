const db = require('../../config/db');
const fs = require('mz/fs');
const passwords = require('../../config/passwords');
const emailValidator = require('email-validator');
const UIDGenerator = require('uid-generator');
const u_id_gen = new UIDGenerator();
const fileType = require('file-type');

/*
T0-DO ->
post - register
post - login
post - logout
get - getUser
patch - changeDetails
 */

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
            let token = await u_id_gen.generate();
            await db.getPool.query("UPDATE User SET auth_token = ? WHERE user_id = ? ", [token, result[0]['user_id']]);
            return Promise.resolve([result, token]);
        } else {
            return Promise.reject(new Error("Bad Request"));
        }
    } catch (error) {
        return Promise.reject(error);
    }
};

exports.logout = async function() {
    //TODO
};

// exports.getUser = async function(id, token) {
//     let queryString = "SELECT name, city, country, email FROM User WHERE user_id = ?"
//     try {
//         let userRows = await db.getPool
//     }
// };

exports.changeDetails = async function() {
    //TODO
};
