'use strict';

const tableName = 'users';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING, BOOLEAN, INTEGER, DATE, JSON } = Sequelize;

    await queryInterface.createTable(
      tableName,
      {
        id: {
          type: INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'id',
        },
        username: { type: STRING(50), allowNull: false, comment: '用户名' },
        email: {
          type: STRING(30),
          allowNull: false,
          comment: 'email',
        },
        roles: {
          type: JSON,
          defaultValue: [],
          comment: '角色',
        },
        salt: {
          type: STRING(30),
          allowNull: false,
          comment: 'salt',
        },
        password: {
          type: STRING(100),
          allowNull: false,
          comment: 'password',
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
        charset: 'utf8',
      },
    );

    await queryInterface.addIndex(tableName, ['username'], {
      unique: true,
      name: `idx_username`,
    });

    await queryInterface.addIndex(tableName, ['email'], {
      unique: true,
      name: `idx_email`,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable(tableName);
  },
};
