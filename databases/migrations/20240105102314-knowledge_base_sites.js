'use strict';

const tableName = 'knowledge_base_sites';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { STRING, BOOLEAN, INTEGER, DATE, JSON, TEXT } = Sequelize;

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
        comment: '网站名/目录',
      },
      desc: {
        type: STRING(200),
        allowNull: true,
        comment: '简介',
      },
      hostname: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '域名信息',
      },
      start_urls: {
        type: JSON,
        defaultValue: [],
        comment: '起始网站的地址',
      },
      match_patterns: {
        type: JSON,
        defaultValue: [],
        comment: '命中的正则',
      },
      ignore_patterns: {
        type: JSON,
        defaultValue: [],
        comment: '忽略的正则',
      },
      remove_selectors: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: '需要移除的选择器',
      },
      evaluate: {
        type: TEXT,
        defaultValue: '',
        comment: '需要执行的js代码',
      },
      engine_type: {
        type: STRING(50),
        allowNull: false,
        comment: '爬取引擎',
      },
      file_suffix: {
        type: STRING(15),
        allowNull: false,
        comment: '文件后缀',
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

    await queryInterface.addIndex(tableName, ['title', 'kb_id'], {
      unique: true,
    });

    await queryInterface.addIndex(tableName, ['owner_id'], {
      unique: false,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
