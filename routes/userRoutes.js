const express = require("express");
const { verifyUserToken } = require("../controllers/authControlleruser");
const router = express.Router();
const {
  getUserdetailsById,
  getWeeksByDoctor,
  getChallengesByDoctor,
  getAllProducts,
  submitChallengeForm,
  getChallengeForm,
  getChallengeFormById,
  updateChallengeForm,
  deleteChallengeForm,
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
router.get("/challenges/:weekId", getChallengesByDoctor);

//{challengesForm}
//create
router.post("/challengeForm",submitChallengeForm)
//getAllchallenges
router.get("/challengeForms",getChallengeForm)
//getChallengesById
router.get("/get/challengeForm",getChallengeFormById)
//updateChallenge
router.put("/update/challengeForm",updateChallengeForm)
//deleteChallenge
router.delete("/delete/challengeForm",deleteChallengeForm)

module.exports = router;
