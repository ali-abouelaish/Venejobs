const router = require("express").Router();
const { authenticateToken } = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const ProposalController = require("../controllers/proposal.controller");

router.post("/", authenticateToken, requireRole("freelancer"), ProposalController.submitProposal);
router.get("/my", authenticateToken, requireRole("freelancer"), ProposalController.getMyProposals);
router.get("/job/:jobId", authenticateToken, requireRole("client"), ProposalController.getProposalsForJob);
router.patch("/:id/accept", authenticateToken, requireRole("client"), ProposalController.acceptProposal);
router.patch("/:id/reject", authenticateToken, requireRole("client"), ProposalController.rejectProposal);

module.exports = router;
