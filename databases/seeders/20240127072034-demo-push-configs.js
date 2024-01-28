'use strict';
// npx sequelize-cli seed:generate --name demo-push-config
const tableName = 'knowledge_base_push_configs';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      tableName,
      [
        {
          id: 1,
          title: 'dify-娱乐',
          desc: '',
          type: 'dify',
          api_key: 'dataset-8lgSbpaK0dSQSeC20EtRQmtV',
          api_url:
            'http://theone-ubuntu.local/v1/datasets/231e6092-860c-4bec-bbda-5f95c3d0f416',
          created_at: new Date(),
          updated_at: new Date(),
          kb_id: 1,
          owner_id: 1,
        },
        {
          id: 2,
          title: 'dify-react-admin 文档',
          desc: '',
          type: 'dify',
          api_key: 'dataset-8lgSbpaK0dSQSeC20EtRQmtV',
          api_url:
            'http://theone-ubuntu.local/v1/datasets/6efcde60-07ef-4540-a696-39e265f26ea0',
          created_at: new Date(),
          updated_at: new Date(),
          kb_id: 2,
          owner_id: 1,
        },
      ],
      {},
    );
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete(tableName, {}, {});
  },
};
