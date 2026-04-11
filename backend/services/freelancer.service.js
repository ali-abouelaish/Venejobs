const freelancerProfileMessages = require("../commonMessages/freelancerProfileMessages");
const {
  sequelize,
  User,
  FreelancerProfile,
  FreelancerSkill,
  FreelancerExperience,
  FreelancerEducation,
  FreelancerLanguage,
  FreelancerPortfolio,
} = require("../models");

const ensureProfile = async (userId, payload, transaction) => {
  const [profile] = await FreelancerProfile.findOrCreate({
    where: { user_id: userId },
    defaults: {
      professional_title: payload.professional_title,
      overview: payload.overview,
      hourly_rate: payload.hourly_rate,
      country: payload.country,
      city: payload.city,
      profile_completed: false
    },
    transaction
  });

  return profile;
};

const saveFreelancerProfile = async (userId, payload) => {
  return sequelize.transaction(async (transaction) => {
    // =========================
    // USER
    // =========================
    let dob = null;

    if (payload.date_of_birth) {
      const parsedDate = new Date(payload.date_of_birth);

      if (!isNaN(parsedDate.getTime())) {
        dob = parsedDate;
      }
    }

    await User.update(
      {
        phone: payload.phone,
        profile_picture: payload.profile_picture,
        date_of_birth: dob,
        street_address: payload.street_address,
        apt_suite: payload.apt_suite,
        city: payload.city,
        state: payload.state,
        zip_code: payload.zip_code,
        country: payload.country
      },
      { where: { id: userId }, transaction }
    );

    // =========================
    // PROFILE
    // =========================
    const profile = await ensureProfile(userId, payload, transaction);

    await profile.update(
      {
        professional_title: payload.professional_title,
        overview: payload.overview,
        hourly_rate: payload.hourly_rate,
        profile_completed: true
      },
      { transaction }
    );

    const freelancerId = profile.id;

    // =========================
    // SKILLS
    // =========================
    await FreelancerSkill.destroy({
      where: { freelancer_id: freelancerId },
      transaction
    });

    if (payload.skills?.length) {
      await FreelancerSkill.bulkCreate(
        payload.skills.map((skill) => ({
          freelancer_id: freelancerId,
          skill_name: skill.name,
          level: skill.level || null
        })),
        { transaction }
      );
    }


    // =========================
    // EXPERIENCES (UPDATED)
    // =========================

    await FreelancerExperience.destroy({
      where: { freelancer_id: freelancerId },
      transaction
    });

    if (payload.experiences?.length) {
      await FreelancerExperience.bulkCreate(
        payload.experiences.map((exp) => ({
          freelancer_id: freelancerId,
          job_title: exp.job_title,
          company: exp.company,
          location: exp.location,
          city: exp.city,
          start_month: exp.start_month,
          start_year: exp.start_year,

          // 👇 IMPORTANT LOGIC
          end_month: exp.is_current ? null : exp.end_month,
          end_year: exp.is_current ? null : exp.end_year,

          is_current: exp.is_current,
          description: exp.description
        })),
        { transaction }
      );
    }


    // =========================
    // EDUCATIONS (UPDATED)
    // =========================
    await FreelancerEducation.destroy({
      where: { freelancer_id: freelancerId },
      transaction
    });

    if (payload.educations?.length) {
      await FreelancerEducation.bulkCreate(
        payload.educations.map((edu) => ({
          freelancer_id: freelancerId,
          institution_name: edu.institution_name,
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          type_of_education: edu.type_of_education,
          start_date: edu.start_date,
          end_date: edu.end_date,
          description: edu.description
        })),
        { transaction }
      );
    }

    // =========================
    // LANGUAGES
    // =========================
    await FreelancerLanguage.destroy({
      where: { freelancer_id: freelancerId },
      transaction
    });

    if (payload.languages?.length) {
      await FreelancerLanguage.bulkCreate(
        payload.languages.map((lang) => ({
          freelancer_id: freelancerId,
          language: lang.language,
          proficiency: lang.proficiency
        })),
        { transaction }
      );
    }

    // =========================
    // PORTFOLIOS
    // =========================
    await FreelancerPortfolio.destroy({
      where: { freelancer_id: freelancerId },
      transaction
    });

    if (payload.portfolios?.length) {
      await FreelancerPortfolio.bulkCreate(
        payload.portfolios.map((portfolio) => ({
          freelancer_id: freelancerId,
          title: portfolio.title,
          description: portfolio.description,
          project_url: portfolio.project_url
        })),
        { transaction }
      );
    }

    return profile;
  });
};

const updateBasicProfile = async (userId, payload) => {
  return sequelize.transaction(async (transaction) => {

    // -------- USER TABLE UPDATE --------
    const userFields = [
      "phone",
      "profile_picture",
      "date_of_birth",
      "street_address",
      "apt_suite",
      "city",
      "state",
      "zip_code",
      "country"
    ];

    const userUpdate = {};
    userFields.forEach(field => {
      if (payload[field] !== undefined) {
        userUpdate[field] = payload[field];
      }
    });

    if (Object.keys(userUpdate).length) {
      await User.update(userUpdate, {
        where: { id: userId },
        transaction
      });
    }

    // -------- PROFILE TABLE --------
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      const err = new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);
      err.statusCode = 404;
      throw err;
    }

    const profileFields = ["professional_title", "overview", "hourly_rate"];
    const profileUpdate = {};

    profileFields.forEach(field => {
      if (payload[field] !== undefined) {
        profileUpdate[field] = payload[field];
      }
    });

    if (Object.keys(profileUpdate).length) {
      await profile.update(profileUpdate, { transaction });
    }

    // 🔥 Fresh updated data fetch (BEST PRACTICE)
    const updatedProfile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "phone",
            "profile_picture",
            "date_of_birth",
            "street_address",
            "apt_suite",
            "city",
            "state",
            "zip_code",
            "country"
          ]
        }
      ],
      transaction
    });

    return updatedProfile;
  });
};


const createSkill = async (userId, data) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      const err = new Error("Profile not found");
      err.statusCode = 404;
      throw err;
    }

    try {
      return await FreelancerSkill.create(
        {
          freelancer_id: profile.id,
          skill_name: data.skill_name,
          level: data.level || null
        },
        { transaction }
      );
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        const e = new Error("Skill already exists");
        e.statusCode = 409;
        throw e;
      }
      throw err;
    }
  });
};

const updateSkill = async (userId, skillId, data) => {
  console.log()
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      const err = new Error("Profile not found");
      err.statusCode = 404;
      throw err;
    }

    const skill = await FreelancerSkill.findOne({
      where: {
        id: skillId,
        freelancer_id: profile.id
      },
      transaction
    });

    if (!skill) {
      const err = new Error("Skill not found");
      err.statusCode = 404;
      throw err;
    }

    const updatedSkill = await skill.update(
      {
        skill_name: data.skill_name,
        level: data.level || null
      },
      { transaction }
    );

    return updatedSkill;
  });
};


const deleteSkill = async (userId, skillId) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      const err = new Error("Profile not found");
      err.statusCode = 404;
      throw err;
    }

    const deleted = await FreelancerSkill.destroy({
      where: {
        id: skillId,
        freelancer_id: profile.id
      },
      transaction
    });

    if (!deleted) {
      const err = new Error("Skill not found");
      err.statusCode = 404;
      throw err;
    }
  });
};

const getSkills = async (userId) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      const err = new Error("Profile not found");
      err.statusCode = 404;
      throw err;
    }

    return await FreelancerSkill.findAll({
      where: { freelancer_id: profile.id },
      transaction
    });
  });
};


const createExperience = async (userId, data) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);

    const existingExperience = await FreelancerExperience.findOne({
      where: {
        freelancer_id: profile.id,
        company: data.company,
        job_title: data.job_title,
        start_year: data.start_year,
        start_month: data.start_month
      },
      transaction
    });

    if (existingExperience) {
      throw new Error(
        "Experience already exists for this company and role."
      );
    }

    return FreelancerExperience.create(
      {
        freelancer_id: profile.id,
        job_title: data.job_title,
        company: data.company,
        location: data.location,
        city: data.city,
        start_month: data.start_month,
        start_year: data.start_year,
        end_month: data.end_month,
        end_year: data.end_year,
        is_current: data.is_current,
        description: data.description
      },
      { transaction }
    );
  });
};

const updateExperience = async (userId, experienceId, data) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      const err = new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);
      err.statusCode = 404;
      throw err;
    }

    const experience = await FreelancerExperience.findOne({
      where: {
        id: experienceId,
        freelancer_id: profile.id
      },
      transaction
    });

    if (!experience) {
      const err = new Error("Experience not found");
      err.statusCode = 404;
      throw err;
    }

    const updatedExperience = await experience.update(
      {
        job_title: data.job_title,
        company: data.company,
        location: data.location,
        city: data.city,
        start_month: data.start_month,
        start_year: data.start_year,
        end_month: data.end_month,
        end_year: data.end_year,
        is_current: data.is_current,
        description: data.description
      },
      { transaction }
    );

    return updatedExperience;
  });
};

const deleteExperience = async (userId, experienceId) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);

    const deleted = await FreelancerExperience.destroy({
      where: {
        id: experienceId,
        freelancer_id: profile.id
      },
      transaction
    });

    if (!deleted) throw new Error("Experience not found");
  });
};

const getUserExperiences = async (userId) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);
    }

    const experiences = await FreelancerExperience.findAll({
      where: {
        freelancer_id: profile.id
      },
      order: [
        ["is_current", "DESC"],
        ["start_year", "DESC"],
        ["start_month", "DESC"]
      ],
      transaction
    });

    return experiences;
  });
};

const createEducation = async (userId, data) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      const error = new Error("Profile not found");
      error.statusCode = 404;
      throw error;
    }

    try {
      return await FreelancerEducation.create(
        {
          freelancer_id: profile.id,
          institution_name: data.institution_name,
          degree: data.degree,
          field_of_study: data.field_of_study,
          type_of_education: data.type_of_education,
          start_date: data.start_date,
          end_date: data.end_date,
          description: data.description
        },
        { transaction }
      );
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        const error = new Error("Education already exists.");
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  });
};

const updateEducation = async (userId, educationId, data) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      const err = new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);
      err.statusCode = 404;
      throw err;
    }

    const education = await FreelancerEducation.findOne({
      where: {
        id: educationId,
        freelancer_id: profile.id
      },
      transaction
    });

    if (!education) {
      const err = new Error("Education not found");
      err.statusCode = 404;
      throw err;
    }

    const updatedEducation = await education.update(
      {
        institution_name: data.institution_name,
        degree: data.degree,
        field_of_study: data.field_of_study,
        type_of_education: data.type_of_education,
        start_date: data.start_date,
        end_date: data.end_date,
        description: data.description
      },
      { transaction }
    );

    return updatedEducation;
  });
};

const deleteEducation = async (userId, educationId) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);

    const deleted = await FreelancerEducation.destroy({
      where: {
        id: educationId,
        freelancer_id: profile.id
      },
      transaction
    });

    if (!deleted) throw new Error("Education not found");
  });
};

const getUserEducations = async (userId) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);
    }

    const educations = await FreelancerEducation.findAll({
      where: {
        freelancer_id: profile.id
      },
      order: [["start_date", "DESC"]],
      transaction
    });

    return educations;
  });
};

const createLanguage = async (userId, data) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });
    if (!profile) throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);

    const existingLanguage = await FreelancerLanguage.findOne({
      where: {
        freelancer_id: profile.id,
        language: data.language
      },
      transaction
    });

    if (existingLanguage) {
      throw new Error("Language already exists.");
    }

    return FreelancerLanguage.create(
      {
        freelancer_id: profile.id,
        language: data.language,
        proficiency: data.proficiency
      },
      { transaction }
    );
  });
};

const updateLanguage = async (userId, languageId, data) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      const err = new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);
      err.statusCode = 404;
      throw err;
    }

    const language = await FreelancerLanguage.findOne({
      where: {
        id: languageId,
        freelancer_id: profile.id
      },
      transaction
    });

    if (!language) {
      const err = new Error("Language not found");
      err.statusCode = 404;
      throw err;
    }

    const updatedLanguage = await language.update(
      {
        language: data.language,
        proficiency: data.proficiency
      },
      { transaction }
    );

    return updatedLanguage;
  });
};


const deleteLanguage = async (userId, languageId) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });
    if (!profile) throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);

    const deleted = await FreelancerLanguage.destroy({
      where: {
        id: languageId,
        freelancer_id: profile.id
      },
      transaction
    });

    if (!deleted) throw new Error("Language not found");
  });
};

const getUserLanguages = async (userId) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);
    }

    const languages = await FreelancerLanguage.findAll({
      where: {
        freelancer_id: profile.id
      },
      order: [["language", "ASC"]],
      transaction
    });

    return languages;
  });
};

const createPortfolio = async (userId, data) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);

    const existingPortfolio = await FreelancerPortfolio.findOne({
      where: {
        freelancer_id: profile.id,
        project_url: data.project_url
      },
      transaction
    });

    if (existingPortfolio) {
      throw new Error("Portfolio with this project URL already exists.");
    }

    return FreelancerPortfolio.create(
      {
        freelancer_id: profile.id,
        title: data.title,
        description: data.description,
        project_url: data.project_url
      },
      { transaction }
    );
  });
};

const updatePortfolio = async (userId, portfolioId, data) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      const err = new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);
      err.statusCode = 404;
      throw err;
    }

    const portfolio = await FreelancerPortfolio.findOne({
      where: {
        id: portfolioId,
        freelancer_id: profile.id
      },
      transaction
    });

    if (!portfolio) {
      const err = new Error("Portfolio not found");
      err.statusCode = 404;
      throw err;
    }

    const updatedPortfolio = await portfolio.update(
      {
        title: data.title,
        description: data.description,
        project_url: data.project_url
      },
      { transaction }
    );

    return updatedPortfolio;
  });
};


const deletePortfolio = async (userId, portfolioId) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);

    const deleted = await FreelancerPortfolio.destroy({
      where: {
        id: portfolioId,
        freelancer_id: profile.id
      },
      transaction
    });

    if (!deleted) throw new Error("Portfolio not found");
  });
};

const getUserPortfolios = async (userId) => {
  return sequelize.transaction(async (transaction) => {
    const profile = await FreelancerProfile.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!profile) {
      throw new Error(freelancerProfileMessages.PROFILE_NOT_FOUND);
    }

    const portfolios = await FreelancerPortfolio.findAll({
      where: {
        freelancer_id: profile.id
      },
      order: [["created_at", "DESC"]],
      transaction
    });

    return portfolios;
  });
};

const getProfile = async (userId) => {
  return User.findOne({
    where: { id: userId },
    attributes: [
      "id",
      "name",
      "lastname",
      "email",
      "phone",
      "profile_picture",
      "city",
      "country"
    ],
    include: [
      {
        model: FreelancerProfile,
        as: "freelancerProfile",
        attributes: [
          "id",
          "professional_title",
          "overview",
          "hourly_rate",
          "profile_completed"
        ],
        include: [
          {
            model: FreelancerSkill,
            as: "skills",
            attributes: ["id", "skill_name", "level"]
          },
          {
            model: FreelancerExperience,
            as: "experiences"
            // attributes optional (return all)
          },
          {
            model: FreelancerEducation,
            as: "educations"
          },
          {
            model: FreelancerLanguage,
            as: "languages"
          },
          {
            model: FreelancerPortfolio,
            as: "portfolios"
          }
        ]
      }
    ]
  });
};

const getBasicProfile = async (userId) => {
  const user = await User.findOne({
    where: { id: userId },
    attributes: [
      "phone",
      "profile_picture",
      "date_of_birth",
      "street_address",
      "apt_suite",
      "city",
      "state",
      "zip_code",
      "country"
    ],
    include: [
      {
        model: FreelancerProfile,
        as: "freelancerProfile",
        attributes: [
          "professional_title",
          "overview",
          "hourly_rate"
        ]
      }
    ]
  });

  if (!user || !user.freelancerProfile) {
    return null;
  }

  return {
    professional_title: user.freelancerProfile.professional_title,
    overview: user.freelancerProfile.overview,
    hourly_rate: user.freelancerProfile.hourly_rate,
    phone: user.phone,
    profile_picture: user.profile_picture,
    date_of_birth: user.date_of_birth,
    street_address: user.street_address,
    apt_suite: user.apt_suite,
    city: user.city,
    state: user.state,
    zip_code: user.zip_code,
    country: user.country
  };
};

async function browseFreelancers(page = 1, limit = 10, skill = null) {
  const offset = (page - 1) * limit;

  const where = { profile_completed: true };

  const include = [
    {
      model: User,
      attributes: ["id", "name"],
    },
    {
      model: FreelancerSkill,
      as: "skills",
      attributes: ["skill_name"],
    },
  ];

  // If skill filter provided, filter through FreelancerSkill
  if (skill) {
    include[1].where = { skill_name: { [require("sequelize").Op.iLike]: `%${skill}%` } };
    include[1].required = true;
  }

  const { rows, count: total } = await FreelancerProfile.findAndCountAll({
    where,
    include,
    limit: Number(limit),
    offset,
    order: [["created_at", "DESC"]],
    distinct: true,
  });

  return {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
    freelancers: rows,
  };
}

async function getPublicFreelancerProfile(userId) {
  const profile = await FreelancerProfile.findOne({
    where: { user_id: userId, profile_completed: true },
    include: [
      {
        model: User,
        attributes: ["id", "name", "profile_picture"],
      },
      { model: FreelancerSkill, as: "skills" },
      { model: FreelancerExperience, as: "experiences" },
      { model: FreelancerEducation, as: "educations" },
      { model: FreelancerLanguage, as: "languages" },
      { model: FreelancerPortfolio, as: "portfolios" },
    ],
  });

  if (!profile) {
    const error = new Error("Freelancer profile not found");
    error.statusCode = 404;
    throw error;
  }

  return profile;
}

module.exports = {
  saveFreelancerProfile,
  updateBasicProfile,
  createSkill,
  updateSkill,
  deleteSkill,
  getSkills,
  createExperience,
  updateExperience,
  deleteExperience,
  getUserExperiences,
  createEducation,
  updateEducation,
  deleteEducation,
  getUserEducations,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  getUserLanguages,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getUserPortfolios,
  getProfile,
  getBasicProfile,
  browseFreelancers,
  getPublicFreelancerProfile,
};