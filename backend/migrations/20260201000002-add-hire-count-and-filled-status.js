'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('jobs', 'hire_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1, max: 10 },
    });

    // Add CHECK constraint
    await queryInterface.sequelize.query(
      `ALTER TABLE jobs ADD CONSTRAINT jobs_hire_count_range CHECK (hire_count >= 1 AND hire_count <= 10)`
    );

    // Add 'filled' to the enum_jobs_status type
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_jobs_status ADD VALUE IF NOT EXISTS 'filled' AFTER 'paused'`
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('jobs', 'hire_count');
    // Note: removing an enum value from PostgreSQL is not straightforward.
    // The 'filled' value will remain in the enum but be unused after rollback.
  },
};
