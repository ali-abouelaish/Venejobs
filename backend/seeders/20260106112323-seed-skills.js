"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "skills",
      [
        // IT & Programming
        { id: "js000001", name: "JavaScript", categoryCode: "it_programming" },
        { id: "js000002", name: "React", categoryCode: "it_programming" },
        { id: "js000003", name: "Node.js", categoryCode: "it_programming" },
        { id: "js000004", name: "Python", categoryCode: "it_programming" },
        { id: "js000005", name: "PHP", categoryCode: "it_programming" },
        { id: "js000006", name: "TypeScript", categoryCode: "it_programming" },
        { id: "js000007", name: "SQL", categoryCode: "it_programming" },

        // Design & Multimedia
        { id: "ds000001", name: "UI Design", categoryCode: "design_multimedia" },
        { id: "ds000003", name: "Wireframing", categoryCode: "design_multimedia" },
        { id: "ds000004", name: "Figma", categoryCode: "design_multimedia" },
        { id: "ds000005", name: "Prototyping", categoryCode: "design_multimedia" },

        // Marketing
        { id: "mk000001", name: "SEO", categoryCode: "marketing" },
        { id: "mk000002", name: "Google Ads", categoryCode: "marketing" },
        { id: "mk000003", name: "Content Marketing", categoryCode: "marketing" },

        // Admin Support
        { id: "ad000001", name: "Data Entry", categoryCode: "admin_support" },
        { id: "ad000002", name: "Customer Support", categoryCode: "admin_support" },

        // Writing & Translation
        { id: "wr000001", name: "Copywriting", categoryCode: "writing_translation" },
        { id: "wr000002", name: "Translation", categoryCode: "writing_translation" }
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("skills", null, {});
  }
};
