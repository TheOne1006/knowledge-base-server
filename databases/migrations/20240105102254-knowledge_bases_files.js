'use strict';

const tableName = 'knowledge_base_files';

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
      file_path: {
        type: STRING(350),
        comment: '文件路径(相对于 kb root)',
      },
      file_ext: {
        type: STRING(20),
        comment: '文件扩展名',
      },
      source_type: {
        type: STRING(20),
        comment: '来源方式',
      },
      source_url: {
        type: STRING(500),
        comment: '来源网址',
      },
      summary: {
        type: STRING(500),
        comment: '总结',
      },
      site_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '所属站点',
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

    await queryInterface.addIndex(tableName, ['file_path'], {
      unique: false,
    });

    await queryInterface.addIndex(tableName, ['owner_id'], {
      unique: false,
    });

    await queryInterface.addIndex(tableName, ['kb_id'], {
      unique: false,
    });
    await queryInterface.addIndex(tableName, ['kb_id', 'file_path'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
