"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "categories",
      [
        { code: "it_programming", name: "IT & Programming" },
        { code: "design_multimedia", name: "Design & Multimedia" },
        { code: "marketing", name: "Marketing" },
        { code: "admin_support", name: "Admin Support" },
        { code: "writing_translation", name: "Writing & Translation" }
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("categories", null, {});
  }
};
