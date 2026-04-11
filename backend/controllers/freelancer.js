const FreelancerService = require("../services/freelancer.service");

const saveProfile = async (req, res) => {
    try {
        await FreelancerService.saveFreelancerProfile(
            req.user.id,
            req.body
        );

        return res.json({
            success: true,
            message: "Profile saved successfully"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const updateProfile = async (req, res) => {
  try {
    const updatedProfile = await FreelancerService.updateBasicProfile(
      req.user.id,
      req.body
    );

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

const getBasicProfile = async (req, res) => {
    try {
        const profile = await FreelancerService.getBasicProfile(
            req.user.id
        );

        return res.json({
            success: true,
            data: profile
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const createSkill = async (req, res) => {
    try {
        const skill = await FreelancerService.createSkill(req.user.id, req.body);
        res.status(201).json({ success: true, data: skill });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
};

const updateSkill = async (req, res) => {
  try {
    const updatedSkill = await FreelancerService.updateSkill(
      req.user.id,
      req.params.skillId,
      req.body
    );

    res.json({
      success: true,
      message: "Skill updated successfully",
      data: updatedSkill
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

const deleteSkill = async (req, res) => {
    try {
        await FreelancerService.deleteSkill(req.user.id, req.params.skillId);
        res.json({ success: true, message: "Skill deleted successfully" });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
};

const getSkills = async (req, res) => {
    try {
        const skills = await FreelancerService.getSkills(req.user.id);
        res.json({ success: true, data: skills });
    } catch (err) {
        res
            .status(err.statusCode || 500)
            .json({ success: false, message: err.message });
    }
};

const createExperience = async (req, res) => {
    try {
        const experience = await FreelancerService.createExperience(
            req.user.id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Experience added successfully",
            data: experience
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const updateExperience = async (req, res) => {
  try {
    const { experienceId } = req.params;

    const updatedExperience = await FreelancerService.updateExperience(
      req.user.id,
      experienceId,
      req.body
    );

    return res.json({
      success: true,
      message: "Experience updated successfully",
      data: updatedExperience
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

const deleteExperience = async (req, res) => {
    try {
        const { experienceId } = req.params;

        await FreelancerService.deleteExperience(
            req.user.id,
            experienceId
        );

        return res.json({
            success: true,
            message: "Experience deleted successfully"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const getUserExperiences = async (req, res) => {
    try {
        const experiences = await FreelancerService.getUserExperiences(
            req.user.id
        );

        return res.json({
            success: true,
            data: experiences
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const createEducation = async (req, res) => {
    try {
        const education = await FreelancerService.createEducation(
            req.user.id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Education added successfully",
            data: education
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }
};

const updateEducation = async (req, res) => {
  try {
    const { educationId } = req.params;

    const updatedEducation = await FreelancerService.updateEducation(
      req.user.id,
      educationId,
      req.body
    );

    res.json({
      success: true,
      message: "Education updated successfully",
      data: updatedEducation
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

const deleteEducation = async (req, res) => {
    try {
        const { educationId } = req.params;

        await FreelancerService.deleteEducation(
            req.user.id,
            educationId
        );

        res.json({
            success: true,
            message: "Education deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const getUserEducations = async (req, res) => {
    try {
        const educations = await FreelancerService.getUserEducations(
            req.user.id
        );

        return res.json({
            success: true,
            data: educations
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const createLanguage = async (req, res) => {
    try {
        const language = await FreelancerService.createLanguage(
            req.user.id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Language added successfully",
            data: language
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateLanguage = async (req, res) => {
  try {
    const { languageId } = req.params;

    const updatedLanguage = await FreelancerService.updateLanguage(
      req.user.id,
      languageId,
      req.body
    );

    res.json({
      success: true,
      message: "Language updated successfully",
      data: updatedLanguage
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

const deleteLanguage = async (req, res) => {
    try {
        const { languageId } = req.params;

        await FreelancerService.deleteLanguage(
            req.user.id,
            languageId
        );

        res.json({
            success: true,
            message: "Language deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getUserLanguages = async (req, res) => {
    try {
        const languages = await FreelancerService.getUserLanguages(
            req.user.id
        );

        return res.json({
            success: true,
            data: languages
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const createPortfolio = async (req, res) => {
    try {
        const portfolio = await FreelancerService.createPortfolio(
            req.user.id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Portfolio added successfully",
            data: portfolio
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updatePortfolio = async (req, res) => {
  try {
    const { portfolioId } = req.params;

    const updatedPortfolio = await FreelancerService.updatePortfolio(
      req.user.id,
      portfolioId,
      req.body
    );

    res.json({
      success: true,
      message: "Portfolio updated successfully",
      data: updatedPortfolio
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

const deletePortfolio = async (req, res) => {
    try {
        const { portfolioId } = req.params;

        await FreelancerService.deletePortfolio(
            req.user.id,
            portfolioId
        );

        res.json({
            success: true,
            message: "Portfolio deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getUserPortfolios = async (req, res) => {
    try {
        const portfolios = await FreelancerService.getUserPortfolios(
            req.user.id
        );

        return res.json({
            success: true,
            data: portfolios
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const profile = await FreelancerService.getProfile(
            req.user.id
        );

        return res.json({
            success: true,
            data: profile
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const browseFreelancers = async (req, res) => {
    try {
        const { page = 1, limit = 10, skill } = req.query;
        const data = await FreelancerService.browseFreelancers(page, limit, skill || null);
        return res.json({ success: true, ...data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const getPublicFreelancerProfile = async (req, res) => {
    try {
        const profile = await FreelancerService.getPublicFreelancerProfile(req.params.userId);
        return res.json({ success: true, profile });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
};

module.exports = {
    saveProfile,
    updateProfile,
    getBasicProfile,
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
    browseFreelancers,
    getPublicFreelancerProfile,
};
