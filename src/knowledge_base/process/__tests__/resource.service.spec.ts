import { Test, TestingModule } from '@nestjs/testing';
import { KbResourceService } from '../resource.service';
import { urlAppendSuffix } from '../../utils/link-format';
import * as fs from 'fs/promises';
// import * as path from 'path';

jest.mock('fs/promises');

describe('KbResourceService', () => {
  let service: KbResourceService;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(async () => {
    mockFs = fs as jest.Mocked<typeof fs>;
    const module: TestingModule = await Test.createTestingModule({
      providers: [KbResourceService],
    }).compile();

    service = module.get<KbResourceService>(KbResourceService);
  });

  describe('checkDir', () => {
    it('should create directory if it does not exist', async () => {
      const dirPath = '/test/path';
      mockFs.access.mockRejectedValueOnce(new Error());
      mockFs.mkdir.mockResolvedValueOnce(undefined);

      let result: any;
      try {
        result = await service.checkDir(dirPath);
      } catch (error) {
        //
      }

      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith(dirPath);
      expect(mockFs.mkdir).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should throw error if path exists and is not a directory', async () => {
      const dirPath = '/test/path';
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.stat.mockResolvedValueOnce(
        Promise.resolve({ isDirectory: () => false }) as any,
      );

      let error: Error;
      try {
        await service.checkDir(dirPath);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toBe('dirPath is not a directory');
      expect(mockFs.access).toHaveBeenCalledWith(dirPath);
      expect(mockFs.stat).toHaveBeenCalledWith(dirPath);
    });

    it('should not create directory if it already exists', async () => {
      const dirPath = '/test/path';
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.stat.mockResolvedValue(
        Promise.resolve({ isDirectory: () => true }) as any,
      );
      mockFs.mkdir.mockResolvedValueOnce(undefined);

      const result = await service.checkDir(dirPath);

      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith(dirPath);
    });
  });

  it('should save html', async () => {
    const kbSiteResRoot = '/test/root';
    const url = 'http://test.com';
    const html = '<html></html>';
    const urlObj = urlAppendSuffix(url);
    const filePath = `${kbSiteResRoot}${urlObj.pathname}`;

    mockFs.writeFile.mockResolvedValueOnce(undefined);

    await service.saveHtml(kbSiteResRoot, url, html);

    expect(mockFs.writeFile).toHaveBeenCalledWith(filePath, html);
  });
});
