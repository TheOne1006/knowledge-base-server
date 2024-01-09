'use strict';

const tableName = 'knowledge_base_sites';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { STRING, BOOLEAN, INTEGER, DATE, JSON } = Sequelize;

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
      pattern: {
        type: Sequelize.STRING(255),
        comment: '正则',
      },
      remove_selectors: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: '需要移除的选择器',
      },
      // todo
      // inject_jquery: {
      //   type: Sequelize.BOOLEAN,
      //   defaultValue: false,
      //   comment: '是否注入jQuery',
      // },
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
