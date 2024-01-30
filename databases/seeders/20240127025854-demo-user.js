'use strict';
// npx sequelize-cli db:seed:all
const tableName = 'users';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      tableName,
      [
        {
          id: 1,
          username: 'root',
          email: 'root@theone.io',
          salt: '1202443f',
          password: '7eb1ed4d29c7d7df6a74034748d9e7b9',
          roles: JSON.stringify(['authenticated', 'user', 'super-admin']),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {},
    );
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete(tableName, {}, {});
  },
};
