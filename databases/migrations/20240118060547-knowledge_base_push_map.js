'use strict';

const tableName = 'knowledge_base_push_maps';

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
        config_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: '配置id',
        },
        type: {
          type: STRING(20),
          comment: '推送类型',
        },
        push_version: {
          type: STRING(20),
          comment: '推送版本',
        },
        file_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: '文件id',
        },
        push_checksum: {
          type: STRING(100),
          allowNull: false,
          comment: '推送文件的唯一性',
        },
        remote_id: {
          type: STRING,
          allowNull: false,
          comment: '远程id',
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
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
    );

    await queryInterface.addIndex(tableName, ['config_id', 'file_id'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
