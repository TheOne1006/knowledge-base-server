'use strict';

const tableName = 'articles';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING, BOOLEAN, TEXT, INTEGER, DATE } = Sequelize;

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
          type: STRING,
          allowNull: false,
          comment: '标题',
        },
        content: {
          type: TEXT,
          allowNull: false,
          comment: '内容信息',
        },
        brief: {
          type: STRING,
          allowNull: false,
          defaultValue: '',
          comment: '简介',
        },
        classification: {
          type: STRING(10),
          allowNull: false,
          defaultValue: '',
          comment: '文章分类 biology/computer/other',
        },
        owner: {
          type: INTEGER,
          allowNull: false,
          defaultValue: '',
          comment: '所有者',
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
        deleted_at: { type: DATE, allowNull: true, comment: '删除日期' },
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
        charset: 'utf8',
      },
    );
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
