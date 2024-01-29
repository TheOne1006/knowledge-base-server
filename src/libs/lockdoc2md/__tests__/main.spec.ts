import * as path from 'path';
import * as fs from 'fs/promises';
import type { Client } from '@larksuiteoapi/node-sdk';
import { Client as LarkClient } from '@larksuiteoapi/node-sdk';
import { LarkDocs2Md } from '../main';
import {
  DocBlock,
  IMAGE_TRANS_TYPE_SKIP,
  IMAGE_TRANS_TYPE_TMP_URL,
  IMAGE_TRANS_TYPE_BASE64,
} from '../types';
import { config } from '../../../../config';

describe('LarkDocs2Md', () => {
  jest.setTimeout(600 * 1000);
  let larkDocs2Md: LarkDocs2Md;

  describe.skip('with mock', () => {
    let mockClient: jest.Mocked<Client>;
    beforeEach(() => {
      mockClient = {
        wiki: {
          space: {
            getNode: jest.fn().mockResolvedValue({
              data: {
                node: {
                  obj_token: 'mock_docx_token',
                  obj_type: 'docx',
                  title: 'title',
                },
              },
            }),
          },
        },
        docx: {
          documentBlock: {
            list: jest.fn().mockResolvedValue({
              data: {
                items: [
                  {
                    block_id: 'block_id',
                    block_type: 'block_type',
                    children: [],
                    title: 'title',
                    version: 0,
                  },
                ],
                has_more: false,
                page_token: 'page_token',
              },
            }),
          },
        },
      } as any as jest.Mocked<Client>;
      larkDocs2Md = new LarkDocs2Md(mockClient);
      // larkDocs2Md['larkClient'] = mockClient;
    });

    it('should create an instance', () => {
      expect(larkDocs2Md).toBeInstanceOf(LarkDocs2Md);
    });

    describe('loopGetDocxBlocks', () => {
      it('should call the correct methods with the correct parameters', async () => {
        const blocks: DocBlock[] = [];
        const fileToken = 'fileToken';
        const pageToken = 'pageToken';

        await larkDocs2Md.loopGetDocxBlocks(blocks, fileToken, pageToken);

        // Add your assertions here
      });
    });

    describe('getAllDocxBlocks', () => {
      it('should call the correct methods with the correct parameters', async () => {
        const fileToken = 'fileToken';

        await larkDocs2Md.getAllDocxBlocks(fileToken);

        // Add your assertions here
      });
    });

    describe('docx2md', () => {
      it('should call the correct methods with the correct parameters', async () => {
        const fileToken = 'fileToken';

        await larkDocs2Md.docx2md(fileToken);

        // Add your assertions here
      });
    });
  });

  describe.skip('docx turly client', () => {
    const test_tmp_path = path.join(__dirname, 'mocks', 'test_tmp_url.md');
    const test_skip_path = path.join(__dirname, 'mocks', 'test_skip.md');
    const test_base64_path = path.join(__dirname, 'mocks', 'test_base64.md');

    const appId = config.FEISHU.appId;
    const appSecret = config.FEISHU.appSecret;
    const client = new LarkClient({
      appId,
      appSecret,
      loggerLevel: 2, // default 3 ; debug 4
    });

    afterAll(async () => {
      await fs.rm(test_tmp_path, { force: true });
      await fs.rm(test_skip_path, { force: true });
      await fs.rm(test_base64_path, { force: true });
    });

    beforeAll(async () => {
      await fs.rm(test_tmp_path, { force: true });
      await fs.rm(test_skip_path, { force: true });
      await fs.rm(test_base64_path, { force: true });
    });

    it(`build docx markdown with ${IMAGE_TRANS_TYPE_TMP_URL}`, async () => {
      larkDocs2Md = new LarkDocs2Md(client, IMAGE_TRANS_TYPE_TMP_URL);
      const md = await larkDocs2Md.docx2md('VM9DdoFDvo9VJlxALfycHq7MnPT');
      // 移除 md 前 13 行
      const mdArr = md.split('\n');
      const mdStr = mdArr.slice(13).join('\n');

      fs.writeFile(test_tmp_path, mdStr);

      expect(mdStr).toMatchSnapshot('VM9DdoFDvo9VJlxALfycHq7MnPT-tmpurl');
      expect(true).toBeTruthy();
    });

    it(`build docx markdown with ${IMAGE_TRANS_TYPE_SKIP}`, async () => {
      larkDocs2Md = new LarkDocs2Md(client, IMAGE_TRANS_TYPE_SKIP);
      const md = await larkDocs2Md.docx2md('VM9DdoFDvo9VJlxALfycHq7MnPT');
      fs.writeFile(test_skip_path, md);
      expect(md).toMatchSnapshot('VM9DdoFDvo9VJlxALfycHq7MnPT-skip');
      expect(true).toBeTruthy();
    });

    it(`build docx markdown with ${IMAGE_TRANS_TYPE_BASE64}`, async () => {
      larkDocs2Md = new LarkDocs2Md(client, IMAGE_TRANS_TYPE_BASE64);
      const md = await larkDocs2Md.docx2md('VM9DdoFDvo9VJlxALfycHq7MnPT');
      fs.writeFile(test_base64_path, md);
      expect(md).toMatchSnapshot('VM9DdoFDvo9VJlxALfycHq7MnPT-base64');
      expect(true).toBeTruthy();
    });
  });

  describe.skip('wiki turly client', () => {
    const test_wiki_path = path.join(__dirname, 'mocks', 'test_wiki.md');
    const appId = config.FEISHU.appId;
    const appSecret = config.FEISHU.appSecret;
    const client = new LarkClient({
      appId,
      appSecret,
      loggerLevel: 2, // default 3 ; debug 4
    });

    afterAll(async () => {
      await fs.rm(test_wiki_path, { force: true });
    });

    beforeAll(async () => {
      await fs.rm(test_wiki_path, { force: true });
    });

    it(`build wiki markdown with ${IMAGE_TRANS_TYPE_SKIP}`, async () => {
      larkDocs2Md = new LarkDocs2Md(client, IMAGE_TRANS_TYPE_SKIP);

      const md = await larkDocs2Md.wiki2md('K6HZwhdM3i4bJrkbh1tciEJ2n7f');

      fs.writeFile(test_wiki_path, md);

      expect(md).toMatchSnapshot();
      expect(true).toBeTruthy();
    });
  });
});
