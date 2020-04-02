const bcrypt = require('bcrypt');
const saltRounds = 10;
exports.hash = async function (password) {
    return await bcrypt.hash(password, saltRounds);
};

exports.compare = async function (storedHash, toCompare) {
    return await bcrypt.compare(toCompare, storedHash)
};