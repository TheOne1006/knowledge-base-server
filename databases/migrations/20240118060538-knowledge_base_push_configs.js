'use strict';

const tableName = 'knowledge_base_push_configs';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { STRING, BOOLEAN, INTEGER, DATE } = Sequelize;

    await queryInterface.createTable(tableName, {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'id',
      },
      title: {
        type: STRING(50),
        allowNull: false,
        comment: '推送配置名称',
      },
      desc: {
        type: STRING(200),
        comment: '知识库简介',
      },
      type: {
        type: STRING(20),
        comment: '推送类型',
      },
      api_key: {
        type: STRING(100),
        comment: 'api Key',
      },
      api_url: {
        type: STRING(100),
        comment: 'api Key',
      },
      kb_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '所属知识库',
      },
      owner_id: {
        type: INTEGER,
        allowNull: false,
        comment: '所属用户',
      },
      created_at: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '创建时间',
      },
      updated_at: {
        type: DATE,
        allowNull: false,
        comment: '更新时间',
      },
      version: {
        type: INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: '更新版本',
      },
      is_deleted: {
        defaultValue: false,
        type: BOOLEAN,
        allowNull: false,
        comment: '是否删除',
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
