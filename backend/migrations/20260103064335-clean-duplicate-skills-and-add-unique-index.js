"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DELETE FROM freelancer_skills a
      USING freelancer_skills b
      WHERE a.id > b.id
        AND a.freelancer_id = b.freelancer_id
        AND a.skill_name = b.skill_name;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE indexname = 'unique_freelancer_skill'
        ) THEN
          CREATE UNIQUE INDEX unique_freelancer_skill
          ON freelancer_skills (freelancer_id, skill_name);
        END IF;
      END$$;
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "freelancer_skills",
      "unique_freelancer_skill"
    );
  }
};
