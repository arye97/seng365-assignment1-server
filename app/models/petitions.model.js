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

exports.view = async function (petitionId) {
   const selectSQL = '';

   try {
       const petition = (await db.getPool().query(selectSQL, petitionId))[0];
       if (petition) {
           const photoLinks = await exports.getPetitionPhotos(petitionId);
           return {
               'petitionId': petition.id,
               'title': petition.title,
               'category': petition.category,
               'authorName': petition.authorName,
               'signatureCount': petition.signatureCount
           };
       } else {
           return null;
       }
   } catch (error) {
       console.log(error.sql);
       throw error;
   }
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
