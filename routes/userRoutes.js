const express = require("express");
const { verifyUserToken } = require("../controllers/authControlleruser");
const router = express.Router();
const {
    getUserdetailsById,
  getWeeksByDoctor,
  getChallengesByDoctor,
  getAllProducts,
} = require("../controllers/userController");

//{verify middleware}
router.use(verifyUserToken);

//getAllproducts
router.get("/products", getAllProducts);
//getUserById
router.get("/getuserdetails", getUserdetailsById);
//getAllweeks
router.get("/weeks", getWeeksByDoctor);
//getAllchallenges
router.get("/challenges", getChallengesByDoctor);

module.exports = router;
