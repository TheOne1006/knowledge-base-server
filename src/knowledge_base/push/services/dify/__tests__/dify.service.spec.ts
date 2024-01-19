import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import * as path from 'path';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import axios from 'axios';
import { PushDifyService } from '../dify.service';

const API_URL = 'http://theone-ubuntu.local/v1/datasets';
const DATATSET_ID = 'c4b1047e-600f-4dcd-bf17-edf1307a4552';
const API_KEY = 'dataset-8lgSbpaK0dSQSeC20EtRQmtV';

// 模拟真实环境
describe('PushDifyService on truely remote server', () => {
  let service: PushDifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushDifyService,
        { provide: WINSTON_MODULE_PROVIDER, useValue: { error: jest.fn() } },
        {
          provide: HttpService,
          useValue: new HttpService(axios.create()),
        },
      ],
    }).compile();

    service = module.get<PushDifyService>(PushDifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create_by_file', () => {
    it('should send a post request and return the document', async () => {
      const url = `${API_URL}/${DATATSET_ID}/document/create_by_file`;
      const filePath = path.join(__dirname, 'mocks', 'mock.txt');
      const actual = await service.createByFile(url, filePath, API_KEY);

      const expected = {
        data_source_type: 'upload_file',
        name: filePath,
        enabled: true,
        display_status: 'indexing',
        word_count: 0,
        hit_count: 0,
        doc_form: 'text_model',
      };

      expect(actual).toMatchObject(expected);
    });
  });

  describe('queryDocuments', () => {
    it('should send a post request and return the document', async () => {
      const url = `${API_URL}/${DATATSET_ID}/documents`;
      const actual = await service.queryDocuments(url, API_KEY);

      expect(actual.data.length).toBeGreaterThan(1);
    });
  });
});
