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
    return userRow[0][0]['user_id'];
}


exports.viewAllDetailedPetitions = async function (startIndex, count, q, categoryId, authorId, sortBy) {
    /*
    [
      {
        "petitionId": 1,
        "title": "Increase the education budget",
        "category": "Animals",
        "authorName": "Adam Anderson",
        "signatureCount": 42
      }
    ]
     */
    let filters = ['startIndex', 'count', 'q', 'categoryId', 'authorId', 'sortBy'];
    let queryString = "SELECT p.petition_id AS petitionId, p.title AS title, c.name AS category, u.name AS authorName, " +
            "(SELECT COUNT(*) FROM Signature AS s WHERE p.petition_id = s.petition_id) AS signatureCount " +
            "FROM Petition AS p " +
            "INNER JOIN Category AS c ON p.category_id = c.category_id " +
            "INNER JOIN User AS u ON p.author_id = u.user_id";


    let values = [];
    let notFinished = true;
    let whereAdded = false;
    let canAddAnd = false;

    for (let filter in filters) {
        if (!filters[filter]) {
            continue;
        }
        if (!whereAdded) {
            queryString += ' WHERE ';
            whereAdded = true;
        } else if (notFinished && canAddAnd){
            queryString += 'AND ';
            canAddAnd = false;
        }
        if (filter === '2') {
            queryString += 'p.title LIKE ? ';
            values.push('%' + filters[filter] + '%');
            canAddAnd = true;
        } else if (filter === '3') {
            queryString += 'p.category_id = ? ';
            values.push(filters[filter]);
            canAddAnd = true;
        } else if (filter === '4') {
            notFinished = false;
            queryString += 'p.author_id = ? ';
            values.push(filters[filter]);
            canAddAnd = true;

        }
    }
    let argsSort;
    if (sortBy) {
        if (sortBy === 'ALPHABETICAL_ASC') {
            argsSort = ' ORDER BY p.title ASC';
        } else if (sortBy === 'ALPHABETICAL_DESC') {
            argsSort = ' ORDER BY p.title DESC';
        } else if (sortBy === 'SIGNATURES_ASC') {
            argsSort = ' ORDER BY s.signatory_id ASC';
        } else if (sortBy === 'SIGNATURES_DESC') {
            argsSort = ' ORDER BY s.signatory_id DESC';
        } else {
            argsSort = ' ORDER BY s.signatory_id DESC';
        }
    } else {
        argsSort = ' ORDER BY s.signatory_id DESC';
    }

    //
    // queryString += " GROUP BY p.petition_id";
    // if (argsSort) {
    //     queryString += argsSort;
    // }
    console.log(queryString);
    try {
        console.log([categoryId, authorId, startIndex, q]);
        let [petitionRows] = await db.getPool().query(queryString, values);
        if (startIndex) {
            petitionRows = petitionRows.slice(startIndex);
        }
        if (count) {
            petitionRows = petitionRows.slice(0, count);
        }
        return Promise.resolve(petitionRows);
    } catch(error) {
        return Promise.reject(error);
    }
};

exports.addNewPetition = async function (petitionBody, token) {

    if (!token) {
        return Promise.reject(new Error("Unauthorized"));
    }
    //Check if the user is an actual person
    let userCheckQuery = "SELECT COUNT(*) FROM User WHERE auth_token = ?";
    let userCheck = await db.getPool().query(userCheckQuery, token);
    userCheck = userCheck[0][0]['COUNT(*)'];
    if (userCheck === 0) {
        return Promise.reject(new Error('Unauthorized'));
    }

    let user = await getUser(token);
    console.log(user);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    if (!petitionBody['title'] || !petitionBody['description'] || !petitionBody['categoryId'] || petitionBody['closingDate'] < new Date(new Date().toUTCString())) {
        return Promise.reject(new Error('Bad Request'));
    }
    let new_id = "SELECT max(petition_id) FROM Petition";
    let petition_id = await db.getPool().query(new_id);
    petition_id = petition_id[0][0]['max(petition_id)'] + 1;
    let created_date = new Date().toISOString().slice(0, 20);
    let queryString = "INSERT INTO Petition (petition_id, title, description, author_id, category_id, created_date, closing_date) VALUES (?, ?, ?, ?, ?, ?, ?)";
    let categoryCheck = "SELECT COUNT(*) FROM Category WHERE category_id = ?";
    let values = [petition_id, petitionBody['title'], petitionBody['description'], user, petitionBody['categoryId'], created_date, petitionBody['closingDate']];
    try {
        let categoryResult = await db.getPool().query(categoryCheck, petitionBody['categoryId']);
        if (categoryResult[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Bad Request"));
        } else {
            await db.getPool().query(queryString, values);
            return Promise.resolve(petition_id);
        }
    } catch(error) {
        return Promise.reject(error);
    }
};

exports.getOnePetition = async function (id) {
    /*
    {
      "petitionId": 1,
      "title": "Increase the education budget",
      "category": "Animals",
      "authorName": "Adam Anderson",
      "signatureCount": 42,
      "description": "Schools need more money.",
      "authorId": 11,
      "authorCity": "Christchurch",
      "authorCountry": "New Zealand",
      "createdDate": "2012-04-23T18:25:43.511Z",
      "closingDate": "2012-04-23T18:25:43.511Z"
    }
     */
    let queryString = "SELECT p.petition_id AS petitionId, p.title AS title, c.name AS category, u.name AS authorName, " +
        "(SELECT COUNT(*) FROM Signature AS s WHERE p.petition_id = s.petition_id) AS signatureCount, p.description AS description, " +
        "p.author_id AS authorId, u.city AS authorCity, u.country AS authorCountry, p.created_date AS createdDate, p.closing_date AS " +
        "closingDate FROM Petition AS p INNER JOIN Category AS c ON p.category_id = c.category_id INNER JOIN User AS u ON " +
        "p.author_id = u.user_id WHERE p.petition_id = ?";
    try {
        let petitionRows = await db.getPool().query(queryString, id);
        console.log(petitionRows[0][0]);
        if (petitionRows.length === 0) {
            return Promise.reject(new Error('Not Found'))
        } else {
            return Promise.resolve(petitionRows[0]);
        }
    } catch (error) {
        return Promise.reject(error);
    }
};

exports.changePetition = async function (petitionBody, id, token) {

    console.log(id, token);
    if (!token) {
        return Promise.reject(new Error("Unauthorized"))
    }
    //check if user is possible
    //Check if the user is an actual person
    let userCheckQuery = "SELECT COUNT(*) FROM User WHERE auth_token = ?";
    let userCheck = await db.getPool().query(userCheckQuery, token);
    userCheck = userCheck[0][0]['COUNT(*)'];
    if (userCheck === 0) {
        return Promise.reject(new Error('Unauthorized'));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }

    //check if author is same as user
    let authorQuery = "SELECT COUNT(*) FROM Petition WHERE author_id = ? AND petition_id = ?";
    let authorCheck = await db.getPool().query(authorQuery, [user, id]);
    authorCheck = authorCheck[0][0]['COUNT(*)'];
    if (authorCheck === 0) {
        return Promise.reject(new Error("Forbidden"));
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
    console.log(petitionBody);
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
        let checkPetitionId = await db.getPool().query(checkExistString, id);
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
    let user = await getUser(token);
    //user is the user_id we need
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let petitionIdQuery = "SELECT petition_id FROM Petition WHERE author_id = ?";
    let petitionId = await db.getPool().query(petitionIdQuery, user);
    petitionId = petitionId[0][0]['petition_id'];
    if (parseInt(id, 10) !== petitionId) {
        console.log('theyre not the same');
        return Promise.reject(new Error("Unauthorized"));
    }
    let deletePetitionQuery = "DELETE FROM Petition WHERE petition_id = ? AND author_id = ?";
    try {
        // remove the petition from Petition table
        let response = await db.getPool().query(deletePetitionQuery, [id, user]);
        return Promise.resolve(response);
    } catch(error) {
        console.log(error);
        return Promise.reject(error);
    }
};

exports.getAllCategories = async function () {
    console.log('did we get here?');
    let queryString = "SELECT * FROM Category";
    try {
        let categoryRows = await db.getPool().query(queryString);
        console.log(categoryRows[0]);
        return Promise.resolve(categoryRows[0]);
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

    let queryString = "SELECT photo_filename FROM Petition WHERE petition_id = ?";
    try {
        let checkPhotoQuery = await db.getPool().query(queryString, id);
        let filename = checkPhotoQuery[0][0]['photo_filename'];
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
    console.log(token);
    if (!token) { return Promise.reject(new Error("Not Found"));}
    let user = await getUser(token);
    if (!user) { return Promise.reject(new Error("Unauthorized"));}
    console.log(user);
    console.log('we got this far!');
    let petitionQuery = "SELECT petition_id FROM Petition WHERE author_id = ?";
    let petitionId = await db.getPool().query(petitionQuery, user);
    petitionId = petitionId[0][0]['petition_id'];
    console.log(petitionId);
    if (petitionId !== parseInt(id, 10)) { return Promise.reject(new Error("Forbidden")); }
    console.log('here we are');
    let filename = "petition" + petitionId + fileType(imageRequestBody)['ext'];
    console.log(filename);
    console.log('here we are');
    let checkPhotoQuery = "SELECT photo_filename FROM Petition WHERE petition_id = ?";
    let updateQuery = "UPDATE Petition SET photo_filename = ? WHERE user_id = ?";

    try {
        let code = 200;
        console.log('we got this far!');
        let checkPhoto = await db.getPool().query(checkPhotoQuery, id);
        console.log(checkPhoto);
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

