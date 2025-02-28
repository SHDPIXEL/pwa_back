const express = require("express");
const { verifyUserToken } = require("../controllers/authControlleruser");
const router = express.Router();
const {
  getUserdetailsById,//{user}
  updateUser,
  getWeeksByDoctor,//{weeks}
  getChallengesByDoctor,//{challenges}
  getAllProducts,//{products}
  getAllRewards,//{rewards}
  redeemReward,//{redeem}
  getUserRedeemedRewards,
  submitChallengeForm,//{challengeforms}
  getChallengeForm,
  getChallengeFormById,
  updateChallengeForm,
  deleteChallengeForm,
  getUserInvoices,//{userInvoices}
} = require("../controllers/userController");

//{verify middleware}
router.use(verifyUserToken);

//{products}
//getAllproducts
router.get("/products", getAllProducts);
//{rewards}
//getAllrewards
router.get("/rewards", getAllRewards);
//{redeem}
//getAllredeem
router.post("/redeem", redeemReward);
router.get("/get/redeem",getUserRedeemedRewards)
//{user}
//getUserById
router.get("/getuserdetails", getUserdetailsById);
router.put("/update", updateUser);
//{weeks}
//getAllweeks
router.get("/weeks", getWeeksByDoctor);
//{challenges}
//getAllchallenges
router.get("/challenges/:weekId", getChallengesByDoctor);
//{userInvoices}
// Route to get invoices for the authenticated user
router.get("/invoices", getUserInvoices);

//{challengesForm}
//create
router.post("/challengeForm",submitChallengeForm)
//getAllchallenges
router.get("/allchallengeForms",getChallengeForm)
//getChallengesById
router.get("/get/challengeForm",getChallengeFormById)
//updateChallenge
router.put("/update/challengeForm",updateChallengeForm)
//deleteChallenge
router.delete("/delete/challengeForm",deleteChallengeForm)

module.exports = router;
