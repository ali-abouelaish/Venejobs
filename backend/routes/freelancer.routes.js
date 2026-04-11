const router = require("express").Router();
const FreelancerController = require("../controllers/freelancer");
const adminOrFreelancer = require("../middleware/adminOrFreelancer");
const { authenticateToken } = require("../middleware/auth");
const validateFreelancerProfile = require("../middleware/validateFreelancerProfile");

// Public routes (no auth required)
router.get("/browse", FreelancerController.browseFreelancers);
router.get("/:userId/profile", FreelancerController.getPublicFreelancerProfile);

router.post("/profile", authenticateToken, validateFreelancerProfile, adminOrFreelancer, FreelancerController.saveProfile);

router.get("/profile", authenticateToken, adminOrFreelancer, FreelancerController.getProfile);

router.patch("/profile/basic", authenticateToken, adminOrFreelancer, FreelancerController.updateProfile);
router.get("/profile/basic", authenticateToken, adminOrFreelancer, FreelancerController.getBasicProfile);

router.post("/skill", authenticateToken, adminOrFreelancer, FreelancerController.createSkill);
router.put("/skill/:skillId", authenticateToken, adminOrFreelancer, FreelancerController.updateSkill);
router.delete("/skill/:skillId", authenticateToken, adminOrFreelancer, FreelancerController.deleteSkill);
router.get("/skills", authenticateToken, adminOrFreelancer, FreelancerController.getSkills);

router.put("/profile/experiences/:experienceId", authenticateToken, adminOrFreelancer, FreelancerController.updateExperience);
router.post("/profile/experience", authenticateToken, adminOrFreelancer, FreelancerController.createExperience);
router.delete("/profile/experience/:experienceId", authenticateToken, adminOrFreelancer, FreelancerController.deleteExperience);
router.get("/profile/experiences", authenticateToken, adminOrFreelancer, FreelancerController.getUserExperiences);

router.post("/profile/education", authenticateToken, adminOrFreelancer, FreelancerController.createEducation);
router.put("/profile/education/:educationId", authenticateToken, adminOrFreelancer, FreelancerController.updateEducation);
router.delete("/profile/education/:educationId", authenticateToken, adminOrFreelancer, FreelancerController.deleteEducation);
router.get("/profile/educations", authenticateToken, adminOrFreelancer, FreelancerController.getUserEducations);

router.post("/profile/language", authenticateToken, adminOrFreelancer, FreelancerController.createLanguage);
router.put("/profile/language/:languageId", authenticateToken, adminOrFreelancer, FreelancerController.updateLanguage);
router.delete("/profile/language/:languageId", authenticateToken, adminOrFreelancer, FreelancerController.deleteLanguage);
router.get("/profile/languages", authenticateToken, adminOrFreelancer, FreelancerController.getUserLanguages);

router.post("/profile/portfolio", authenticateToken, adminOrFreelancer, FreelancerController.createPortfolio);
router.put("/profile/portfolio/:portfolioId", authenticateToken, adminOrFreelancer, FreelancerController.updatePortfolio);
router.delete("/profile/portfolio/:portfolioId", authenticateToken, adminOrFreelancer, FreelancerController.deletePortfolio);
router.get("/profile/portfolios", authenticateToken, adminOrFreelancer, FreelancerController.getUserPortfolios);

module.exports = router;
