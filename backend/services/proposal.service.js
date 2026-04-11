const { sequelize, Proposal, Job, Order, User } = require("../models");

async function submitProposal(freelancerId, { job_id, cover_letter, proposed_amount, estimated_duration }) {
  if (!cover_letter || !cover_letter.trim()) {
    throw new Error("Cover letter is required.");
  }
  if (!proposed_amount || Number(proposed_amount) <= 0) {
    throw new Error("Proposed amount must be greater than 0.");
  }
  if (!estimated_duration) {
    throw new Error("Estimated duration is required.");
  }

  const validDurations = ["1_2_days", "1_4_weeks", "1_3_months", "3_6_months", "ongoing"];
  if (!validDurations.includes(estimated_duration)) {
    throw new Error("Invalid estimated duration.");
  }

  const job = await Job.findByPk(job_id);
  if (!job) {
    throw new Error("Job not found.");
  }
  if (job.status !== "published") {
    throw new Error("This job is not accepting proposals.");
  }

  const existing = await Proposal.findOne({ where: { job_id, freelancer_id: freelancerId } });
  if (existing) {
    throw new Error("You have already submitted a proposal for this job.");
  }

  const proposal = await Proposal.create({
    job_id,
    freelancer_id: freelancerId,
    cover_letter: cover_letter.trim(),
    proposed_amount: Number(proposed_amount),
    estimated_duration,
    status: "pending",
  });

  return proposal;
}

async function getProposalsForJob(jobId, clientId) {
  const job = await Job.findOne({ where: { id: jobId, client_id: clientId } });
  if (!job) {
    throw new Error("Job not found or you are not authorized to view its proposals.");
  }

  const proposals = await Proposal.findAll({
    where: { job_id: jobId },
    include: [
      {
        model: User,
        as: "freelancer",
        attributes: ["id", "name", "email", "profile_picture"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return proposals;
}

async function acceptProposal(proposalId, clientId) {
  const proposal = await Proposal.findOne({
    where: { id: proposalId },
    include: [{ model: Job, as: "job" }],
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }
  if (proposal.job.client_id !== clientId) {
    throw new Error("You are not authorized to perform this action.");
  }
  if (proposal.status !== "pending") {
    throw new Error("This proposal has already been accepted or rejected.");
  }

  const order = await sequelize.transaction(async (t) => {
    await proposal.update({ status: "accepted" }, { transaction: t });

    await Proposal.update(
      { status: "rejected" },
      {
        where: {
          job_id: proposal.job_id,
          status: "pending",
          id: { [require("sequelize").Op.ne]: proposal.id },
        },
        transaction: t,
      }
    );

    const newOrder = await Order.create(
      {
        type: "proposal",
        job_id: proposal.job_id,
        proposal_id: proposal.id,
        client_id: clientId,
        freelancer_id: proposal.freelancer_id,
        amount: proposal.proposed_amount,
        status: "active",
      },
      { transaction: t }
    );

    return newOrder;
  });

  return order;
}

async function rejectProposal(proposalId, clientId) {
  const proposal = await Proposal.findOne({
    where: { id: proposalId },
    include: [{ model: Job, as: "job" }],
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }
  if (proposal.job.client_id !== clientId) {
    throw new Error("You are not authorized to perform this action.");
  }
  if (proposal.status !== "pending") {
    throw new Error("This proposal has already been accepted or rejected.");
  }

  await proposal.update({ status: "rejected" });
  return proposal;
}

async function getMyProposals(freelancerId) {
  const proposals = await Proposal.findAll({
    where: { freelancer_id: freelancerId },
    include: [
      {
        model: Job,
        as: "job",
        attributes: ["id", "title", "budget_amount", "budget_type", "status"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return proposals;
}

module.exports = {
  submitProposal,
  getProposalsForJob,
  acceptProposal,
  rejectProposal,
  getMyProposals,
};
