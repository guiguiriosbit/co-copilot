const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: console.log
});

async function migrate() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('LoopVideos');

    if (!tableInfo.duration) {
      console.log('Adding duration column to LoopVideos...');
      await queryInterface.addColumn('LoopVideos', 'duration', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }

    console.log('Migration v7 (duration in LoopVideos) completed successfully.');
  } catch (error) {
    console.error('Migration v7 failed:', error);
  } finally {
    await sequelize.close();
  }
}

migrate();
