const express = require("express");
const { verifyAdminToken } = require("../controllers/authControlleradmin");
const router = express.Router();
const {
  createWeek, //{weeks}
  getAllWeeks,
  getWeekById,
  updateWeek,
  deleteWeek,
  createChallenge, //{challenges}
  getAllChallenges,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  createProduct, //{products}
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createReward, //{Rewards}
  getAllRewards,
  getRewardById,
  updateReward,
  deleteReward,
  getAllUsers,//{user}
} = require("../controllers/adminController");

//{verify middleware}
router.use(verifyAdminToken);

//{weekRoutes}
//create
router.post("/week",createWeek)
//getAllWeek
router.get("/week",getAllWeeks)
//getWeekById
router.get("/get/week/:id",getWeekById)
//updateWeek
router.put("/update/week/:id",updateWeek)
//deleteWeek
router.delete("/delete/week/:id",deleteWeek)

//{challengesRoutes}
//create
router.post("/challenge",createChallenge)
//getAllchallenges
router.get("/challenges",getAllChallenges)
//getChallengesById
router.get("/get/challenge/:id",getChallengeById)
//updateChallenge
router.put("/update/challenge/:id",updateChallenge)
//deleteChallenge
router.delete("/delete/challenge/:id",deleteChallenge)

//{productRoutes}
//create
router.post("/product",createProduct)
//getAllproducts
router.get("/products",getAllProducts)
//getProductById
router.get("/get/product/:id",getProductById)
//updateProduct
router.put("/update/product/:id",updateProduct)
//deleteProduct
router.delete("/delete/product/:id",deleteProduct)

//{rewardRoutes}
//create
router.post("/reward",createReward)
//getAllproducts
router.get("/rewards",getAllRewards)
//getProductById
router.get("/get/reward/:id",getRewardById)
//updateProduct
router.put("/update/reward/:id",updateReward)
//deleteProduct
router.delete("/delete/reward/:id",deleteReward)

//{user}
//getAllusers
router.get("/users",getAllUsers)

module.exports = router;
