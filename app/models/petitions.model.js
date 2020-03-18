const db = require('../../config/db');
const fs = require('mz/fs');

/*
Models needed
get - view
post - add
get - info
patch - change
delete - remove
get - categories
 */

exports.view = async function () {
    let promises = [];

    const sqlQuery = 'select * from ';
    // const sql = await fs.readFile('app/resources/create_database.sql', 'utf8');
    // promises.push(db.getPool().query(sql));  // sync call to recreate DB
    //
    // const files = await fs.readdir(photoDirectory);
    // for (const file of files) {
    //     if (file !== '.gitkeep') promises.push(fs.unlink(photoDirectory + file));  // sync call to delete photo
    // }

    return Promise.all(promises);  // async wait for DB recreation and photos to be deleted
};

exports.add = async function () {
    //TODO
};

exports.info = async function () {
    //TODO
};

exports.change = async function () {
    //TODO
};

exports.remove = async function () {
    //TODO
};

exports.categories = async function () {
    //TODO
};
