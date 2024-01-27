'use strict';

const tableName = 'knowledge_base_sites';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      tableName,
      [
        {
          id: 1,
          title: 'yozi',
          desc: '柚子',
          hostname: 'https://pwnbqysk33g.feishu.cn/',
          start_urls: JSON.stringify(['docx/JoV5dnUaMoCmPjx8K9xc76zSnXd']),
          match_patterns: JSON.stringify([
            '^https:\\/\\/pwnbqysk33g.feishu.cn\\/docx\\/',
          ]),
          ignore_patterns: '[]',
          remove_selectors: JSON.stringify([
            'div.navigation-bar-wrapper',
            'div.catalogue-container',
          ]),
          evaluate: `
           await page.evaluate(async () => {
                await new Promise((resolve) => {
                    var totalHeight = 0;
                    var distance = 100;
                    var timer = setInterval(() => {
                        var scrollHeight = document.querySelector('.bear-web-x-container').scrollHeight;
                        document.querySelector('.bear-web-x-container').scrollBy(0, distance);
                        totalHeight += distance;

                        if(totalHeight >= scrollHeight){
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });
          return page.content();
          `,
          kb_id: 1,
          owner_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          title: 'react-admin-doc',
          desc: 'react-admin 文档',
          hostname: 'https://marmelab.com/',
          start_urls: JSON.stringify(['/react-admin/Resource.html']),
          match_patterns: JSON.stringify(['^https:\\/\\/marmelab.com/.*']),
          ignore_patterns: JSON.stringify([
            '^https:\\/\\/marmelab.com\\/react-admin\\/doc\\/.*',
          ]),
          remove_selectors: JSON.stringify(['header']),
          kb_id: 2,
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
