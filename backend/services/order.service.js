const { Order, Job, User, FreelancerProfile } = require("../models");

async function createDirectOrder(clientId, { freelancer_id, description, amount, estimated_duration }) {
  if (!description || !description.trim()) {
    throw new Error("Description is required.");
  }
  if (!amount || Number(amount) <= 0) {
    throw new Error("Amount must be greater than 0.");
  }
  if (!estimated_duration) {
    throw new Error("Estimated duration is required.");
  }

  const validDurations = ["1_2_days", "1_4_weeks", "1_3_months", "3_6_months", "ongoing"];
  if (!validDurations.includes(estimated_duration)) {
    throw new Error("Invalid estimated duration.");
  }

  const freelancer = await User.findByPk(freelancer_id);
  if (!freelancer) {
    throw new Error("Freelancer not found.");
  }

  const profile = await FreelancerProfile.findOne({
    where: { user_id: freelancer_id, profile_completed: true },
  });
  if (!profile) {
    throw new Error("This freelancer has not completed their profile.");
  }

  if (clientId === Number(freelancer_id)) {
    throw new Error("You cannot hire yourself.");
  }

  const order = await Order.create({
    type: "direct",
    job_id: null,
    proposal_id: null,
    client_id: clientId,
    freelancer_id: Number(freelancer_id),
    amount: Number(amount),
    description: description.trim(),
    status: "active",
  });

  return order;
}

async function getMyOrders(userId, roleName) {
  const where = roleName === "client" ? { client_id: userId } : { freelancer_id: userId };

  const orders = await Order.findAll({
    where,
    include: [
      {
        model: Job,
        as: "job",
        attributes: ["id", "title"],
        required: false,
      },
      {
        model: User,
        as: "client",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "freelancer",
        attributes: ["id", "name"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return orders;
}

async function getOrderById(orderId, userId) {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: Job,
        as: "job",
        attributes: ["id", "title", "description"],
        required: false,
      },
      {
        model: User,
        as: "client",
        attributes: ["id", "name", "email"],
      },
      {
        model: User,
        as: "freelancer",
        attributes: ["id", "name", "email"],
      },
    ],
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.client_id !== userId && order.freelancer_id !== userId) {
    const error = new Error("You are not authorized to view this order.");
    error.statusCode = 403;
    throw error;
  }

  return order;
}

module.exports = {
  createDirectOrder,
  getMyOrders,
  getOrderById,
};
