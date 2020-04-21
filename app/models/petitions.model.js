const db = require('../../config/db');
const fs = require('mz/fs');
const fileType = require('file-type');
/*
Models needed
get - view
post - add
get - info
patch - change
delete - remove
get - categories
 */
async function getUser(token) {
    if (!token) {
        return null;
    }
    let queryString = "SELECT user_id FROM User WHERE auth_token = ?";
    let userRow = await db.getPool().query(queryString, token);
    if (userRow.length < 1) {
        return null;
    }
    return userRow[0]['user_id'];
}



exports.viewAllPetitions = async function (startIndex, count, q, categoryId, authorId, sortBy) {
    let argsWhere = [];
    let argsValues = [];
    let argsSort = null;
    if (count) {
        argsWhere.push("count = ?");
        argsValues.push(count);
    }
    if (q) {
        argsWhere.push("title LIKE ?");
        argsValues.push('%' + q + '%');
    }
    if (categoryId) {
        argsWhere.push("categoryId = ?");
        argsValues.push(categoryId);
    }
    if (authorId) {
        argsWhere.push("authorId = ?");
        argsValues.push(authorId);
    }
    if (sortBy) {
        if (sortBy === 'ALPHABETICAL_ASC') {
            argsSort = ' ORDER BY petition_title ASC';
        } else if (sortBy === 'ALPHABETICAL_DESC') {
            argsSort = ' ORDER BY petition_title DESC';
        } else if (sortBy === 'SIGNATURES_ASC') {
            argsSort = ' ORDER BY signature_id ASC';
        } else if (sortBy === 'SIGNATURES_DESC') {
            argsSort = ' ORDER BY signature_id DESC';
        } else {
            argsSort = ' ORDER BY signature_id DESC';
        }
    } else {
        argsSort = ' ORDER BY signature_id DESC';
    }
    let queryString = "SELECT Petiton.petitionId, Petition.title, categoryId, count";
    let primaryPhotoQuery = "SELECT Petition.petitionId, photo_filename FROM Petition LEFT OUTER JOIN PetitionPhoto PP on Petition.petitionId = PP.petitionId";
    if (argsWhere.length > 0) {
        queryString += " WHERE " + argsWhere.join(" AND ");
    }
    queryString += " GROUP BY Petition.petitionId";
    if (argsSort) {
        queryString += argsSort;
    }
    try {
        let petitionRows = await db.getPool().query(queryString, argsValues)
        let photoRows = await db.getPool.query(primaryPhotoQuery);
        let rows = [petitionRows, photoRows]
        return Promise.resolve(rows);
    } catch(error) {
        return Promise.reject(error);
    }
};

exports.addNewPetition = async function (petitionBody, token) {
    //TODO
    if (!token) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    if (!petitionBody['title'] || !petitionBody['description'] || !petitionBody['categoryId'] || petitionBody['closingDate'] < new Date(new Date().toUTCString())) {
        return Promise.reject(new Error('Bad Request'));
    }
    let queryString = "INSERT INTO Petition (title, description, categoryId, closingDate)";
    let categoryCheck = "SELECT COUNT(*) FROM PetitionCategory WHERE category_id = ?";
    let values = [petitionBody['title'], petitionBody['description'], petitionBody['category_id'], petitionBody['closingDate']]
    try {
        let categoryResult = await db.getPool().query(categoryCheck, petitionBody['category_id']);
        if (categoryResult[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Bad Request"));
        } else {
            let result = await db.getPool().query(queryString, values);
            return Promise.resolve(result);
        }
    } catch(error) {
        return Promise.reject(error);
    }
};

exports.getOnePetition = async function (id) {
    //TODO
    let queryString = "SELECT p.petition_id AS petitionId," +
                      "p.title AS title," +
                      "c.name AS category," +
                      "u.name AS authorName," +
                      "(SELECT COUNT(*) FROM Signature AS s " +
                      "WHERE p.petition_id = s.petition_id) AS signatureCount" +
                      "FROM Petition AS p" +
                      "INNER JOIN Category AS c ON p.category_id = c.category_id" +
                      "INNER JOIN User AS u ON p.author_id = u.user_id";
    let photoQueryString = "SELECT photo_filename, photo_description, is_primary FROM PetitionPhoto WHERE petition_id = ?";
    try {
        let petitionRows = await db.getPool().query(queryString);
        if (petitionRows.length === 0) {
            return Promise.reject(new Error('Not Found'))
        } else {
            let photoRows = await db.getPool().query(photoQueryString, id);
            return Promise.resolve([petitionRows[0], photoRows]);
        }
    } catch (error) {
        return Promise.reject(error);
    }
};

exports.changePetition = async function (petitionBody, id, token) {
    if (!token) {
        return Promise.reject(new Error("Unauthorized"))
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    /*
    petitionBody =
    {
          "title": "Increase the education budget",
          "description": "Schools need more money.",
          "categoryId": 1,
          "closingDate": "2012-04-23 18:25:43.511"
    }
     */
    let title = petitionBody['title'];
    let description = petitionBody['description'];
    let categoryId = petitionBody['categoryId'];
    let closingDate = petitionBody['closingDate'];
    let titleValid = true;
    let descriptionValid = true;
    let categoryIdValid = true;
    let closingDateValid = true;

    let setArgs = [];
    let values = [];

    if (!title) {
        titleValid = false;
        if (title !== undefined && title.length < 1) {
            return Promise.reject(new Error("Bad Request"));
        }
    } else {
        setArgs.push("title = ?");
        values.push(title)
    }
    if (!description) {
        descriptionValid = false;
        if (description !== undefined && description.length < 1) {
            return Promise.reject(new Error("Bad Request"));
        }
    } else {
        setArgs.push("description = ?");
        values.push(description)
    }
    if (!categoryId) {
        categoryIdValid = false;
    } else {
        setArgs.push("categoryId = ?");
        values.push(categoryId);
    }
    if (!closingDate) {
        closingDateValid = false;
    } else {
        setArgs.push("closingDate = ?");
        values.push(closingDate);
    }

    if (!titleValid && !descriptionValid && !categoryIdValid && !closingDateValid) {
        return Promise.reject(new Error("Bad Request"));
    }

    let queryString = "UPDATE Petition Set " + setArgs.join(", ") + "WHERE petition_id = ?";
    let checkExistString = "SELECT COUNT(*) FROM Petition WHERE petition_id = ?";
    let categoryCheckString = "SELECT COUNT(*) FROM Category WHERE category_id = ?";
    values.push(id);
    try {
        //Check petition exists
        let checkPetitionId = await db.getPool().query(idCheck, id);
        if (checkPetitionId[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Not Found"));
        }
        //Check category is valid
        if (categoryIdValid) {
            let categoryCheck = await db.getPool().query(categoryCheckString, categoryId);
            if (categoryCheck[0]['COUNT(*)'] === 0) {
                return Promise.reject(new Error("Bad Request"));
            }
        }
        //update the petition
        let result = await db.getPool().query(queryString, values);
        return Promise.resolve(result);
    } catch (error) {
        return Promise.reject(error);
    }

};

exports.removePetition = async function (id, token) {
    //TODO
    let user = await getUser(token);
    //user is the user_id we need
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    //make up the queries
    let deletePetitionQuery = "DELETE FROM Petition as Petition WHERE petition_id = ? AND p.author_id = u.user_id"
    try {
        // remove the petition from Petition table
        let response = await db.getPool().query(deletePetitionQuery, [id, user])
        return Promise.resolve(response);
    } catch(error) {
        return Promise.reject(error);
    }
};

exports.getAllCategories = async function () {
    //TODO
    let queryString = "SELECT * FROM Category";
    try {
        let categoryRows = await db.getPool().query(queryString);
        return Promise.resolve(categoryRows);
    } catch(error) {
        return Promise.reject(error)
    }
};

////START OF PETITIONS.SIGNATURES
/*
    What I need:
    - getPetitionSignatures(id)
    - signPetition(id) //user cannot sign a petition they have already signed
    - removeSignature(id) //user cannot remove signature from something they havent signed
 */

exports.getPetitionSignatures = async function(id) {
    let queryString = "SELECT s.signatory_id, u.name, u.city, u.country, s.signed_date  FROM Signature AS s INNER JOIN User AS u ON s.signatory_id = u.user_id WHERE petition_id = ? " +
    "ORDER_BY s.signed_date ASC";

    try {
        let response = await db.getPool(queryString, id);
        if (!response) {
            return Promise.reject("Not Found");
        }
        return Promise.resolve(response);
    } catch (error) {
        return Promise.reject(error);
    }

};

exports.signPetition = async function(id, token) {

    if (!token) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    ///query for adding the signature
    let queryString = "INSERT INTO Signature (user_id, petition_id, signed_date) VALUES (?,?,?)";

    let signed_date = new Date().getDate();
    try {
        let addSignature = await db.getPool().query(queryString, [user, id, signed_date]);
        return Promise.resolve(addSignature);
    } catch (error) {
        return Promise.reject(error);
    }
};

exports.removeSignature = async function(id, token) {
    //id here is the petition id
    //get the user with the petition id
    if (!token) {
        return Promise.reject(new Error("Not Found"));
    }
    let user = getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let queryString = "DELETE FROM Signature WHERE petition_id = ? AND signatory_id = ?";
    try {
        let deleteSig = await db.getPool().query(queryString, [id, user]);
        return Promise.resolve(deleteSig);
    } catch (error) {
        return Promise.reject(error);
    }
};


///START OF PETITIONS.PHOTOS

/*
    What I need:
    - getPetitionHeroImage(id)
    - setPetitionHeroImage(id)
 */

exports.getPetitionHeroImage = async function(id, token) {
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

exports.setPetitionHeroImage = async function(id, token, imageRequestBody) {
    let user = await getUser(token);
    if (!token) { return Promise.reject(new Error("Not Found"));}
    if (!user) { return Promise.reject(new Error("Unauthorized"));}
    if (user !== parseInt(id, 10)) { return Promise.reject(new Error("Forbidden")); }
    let filename = "petition" + id + fileType(imageRequestBody)['ext'];
    let checkPhotoQuery = "SELECT photo_filename FROM Petition WHERE petition_id = ? AND author_id = ?";
    let updateQuery = "UPDATE Petition SET photo_filename = ? WHERE user_id = ?";

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

