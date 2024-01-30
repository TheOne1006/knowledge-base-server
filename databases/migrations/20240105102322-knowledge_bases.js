'use strict';

const tableName = 'knowledge_bases';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { STRING, BOOLEAN, INTEGER, DATE } = Sequelize;

    await queryInterface.createTable(
      tableName,
      {
        id: {
          type: INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'id',
        },
        title: {
          type: STRING(50),
          allowNull: false,
          comment: '知识库名称',
        },
        desc: {
          type: STRING(200),
          comment: '知识库简介',
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
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
    );

    await queryInterface.addIndex(tableName, ['title', 'owner_id'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
