const db = require('../../config/db');
const fs = require('mz/fs');

exports.resetDb = async function () {
    let promises = [];

    const sql = await fs.readFile('app/resources/create_database.sql', 'utf8');
    promises.push(db.getPool().query(sql));  // sync call to recreate DB

    const files = await fs.readdir(photoDirectory);
    for (const file of files) {
        if (file !== '.gitkeep') promises.push(fs.unlink(photoDirectory + file));  // sync call to delete photo
    }

    return Promise.all(promises);  // async wait for DB recreation and photos to be deleted
};