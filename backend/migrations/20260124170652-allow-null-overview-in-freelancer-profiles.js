module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("freelancer_profiles", "overview", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("freelancer_profiles", "overview", {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
};
