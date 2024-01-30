'use strict';

const tableName = 'knowledge_bases';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      tableName,
      [
        {
          id: 1,
          title: 'feishu-shipin',
          desc: '电视剧电影百度云盘',
          owner_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          title: 'react-admin-doc',
          desc: 'react-admin 文档',
          owner_id: 1,
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
