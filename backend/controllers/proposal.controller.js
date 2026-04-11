const ProposalService = require("../services/proposal.service");

const submitProposal = async (req, res) => {
  try {
    const proposal = await ProposalService.submitProposal(req.user.id, req.body);
    return res.status(201).json({ success: true, message: "Proposal submitted successfully.", proposal });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getProposalsForJob = async (req, res) => {
  try {
    const proposals = await ProposalService.getProposalsForJob(req.params.jobId, req.user.id);
    return res.json({ success: true, proposals });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const acceptProposal = async (req, res) => {
  try {
    const order = await ProposalService.acceptProposal(req.params.id, req.user.id);
    return res.json({ success: true, message: "Proposal accepted. Order created.", order });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const rejectProposal = async (req, res) => {
  try {
    const proposal = await ProposalService.rejectProposal(req.params.id, req.user.id);
    return res.json({ success: true, message: "Proposal rejected.", proposal });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const getMyProposals = async (req, res) => {
  try {
    const proposals = await ProposalService.getMyProposals(req.user.id);
    return res.json({ success: true, proposals });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  submitProposal,
  getProposalsForJob,
  acceptProposal,
  rejectProposal,
  getMyProposals,
};
