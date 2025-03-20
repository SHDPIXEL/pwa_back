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
  getAllRedeemedRewards,//{redeem}
  getRedeemedRewardsGraph,
  getAllRewards,
  getRewardById,
  updateReward,
  deleteReward,
  getAllUsers,//{user}
  getAllChallengeForms,//{ChallengeForm}
  updateChallengeForm,
  getAllCompletedPayments,//{payments/SoldItems}
  getAllCompletedPaymentsWithInvoices,
  getCompletedPaymentsGraph,
  getAllPayments,//allpayments
  getAllOrders,//allorders
  updatePaymentStatus
} = require("../controllers/adminController");
const { route } = require("./userRoutes");

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

//{redeem}
//getAllRedeem
router.get("/redeem",getAllRedeemedRewards)
//getAllRedeemGraph
router.get("/redeem/graph",getRedeemedRewardsGraph)

//{user}
//getAllusers
router.get("/users",getAllUsers)

//{payments}
//getAllSoldItems
router.get("/soldItems",getAllCompletedPayments)
router.get("/paymentInvoices",getAllCompletedPaymentsWithInvoices)
//{soldItemsGraph}
router.get("/soldItemsGraph",getCompletedPaymentsGraph)

//{ChallengeForm}
//getAllchallenges
router.get("/challengeForms",getAllChallengeForms )
//getChallengeFormById
router.put("/get/challengeForm/:id", updateChallengeForm)
//getAllPayments
router.get("/getPayments",getAllPayments)
//getAllOrders
router.get("/getOrders",getAllOrders)
router.put("/updatePaymentStatus", updatePaymentStatus);


module.exports = router;
