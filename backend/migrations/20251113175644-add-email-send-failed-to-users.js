"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("users");

    // If column already exists → skip
    if (tableInfo.email_send_failed) {
      console.log("⚠️ email_send_failed already exists — skipping migration.");
      return;
    }

    // Otherwise add column
    await queryInterface.addColumn("users", "email_send_failed", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    // Remove column only if exists
    const tableInfo = await queryInterface.describeTable("users");

    if (tableInfo.email_send_failed) {
      await queryInterface.removeColumn("users", "email_send_failed");
    }
  }
};
