"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex(
      "freelancer_educations",
      "unique_freelancer_education"
    ).catch(() => { });

    await queryInterface.addIndex(
      "freelancer_educations",
      ["freelancer_id", "institution_name", "start_date"],
      {
        unique: true,
        name: "unique_freelancer_education"
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "freelancer_educations",
      "unique_freelancer_education"
    );
  }
};
