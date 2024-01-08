// FILEPATH: /Users/theone/Programme/my-project/knowledge-base-server/src/knowledge_base/process/resource.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { KbProcessService } from './resource.service';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');

describe('KbProcessService', () => {
  let service: KbProcessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KbProcessService],
    }).compile();

    service = module.get<KbProcessService>(KbProcessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDir', () => {
    it('should create directory if not exists', async () => {
      const dirPath = path.join(__dirname, 'testDir');
      (fs.stat as jest.Mock).mockRejectedValueOnce(
        new Error("ENOENT: no such file or directory, stat 'testDir'"),
      );
      await service.checkDir(dirPath);
      expect(fs.mkdir).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should not create directory if it exists', async () => {
      const dirPath = path.join(__dirname, 'testDir');
      (fs.stat as jest.Mock).mockResolvedValueOnce({});
      await service.checkDir(dirPath);
      expect(fs.mkdir).not.toHaveBeenCalled();
    });
  });
});
