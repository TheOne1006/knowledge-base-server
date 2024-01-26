import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PushController } from '../push.controller';
import { PushConfigService } from '../../services/push-config.service';
import { PushMapService } from '../../services/push-map.service';
import { PushLogService } from '../../services/push-log.service';
import { PushProcessService } from '../../services/push-process.service';
import { KbService } from '../../../kb/kb.service';
import { KbFileService } from '../../../file/file.service';
import { I18nService } from 'nestjs-i18n';

describe('PushController', () => {
  let controller: PushController;
  let mockPushConfigService: PushConfigService;
  let mockPushLogService: PushLogService;
  let mockPushMapService: PushMapService;
  let mockPushProcessService: PushProcessService;
  let mockKbFileService: KbFileService;
  let mockKbService: KbService;

  beforeEach(async () => {
    mockPushConfigService = {} as any;
    mockPushLogService = {
      findLastOne: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    } as any as PushLogService;
    mockPushMapService = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 1,
          fileId: 1,
          kbId: 1,
          pushVersion: 'v1',
        },
        {
          id: 2,
          fileId: 2,
          kbId: 1,
          pushVersion: 'v2',
        },
        {
          id: 3,
          fileId: 232123123,
          kbId: 1,
          pushVersion: 'remove',
        },
      ]),
      removeByPk: jest.fn(),
      batchDeleteByIds: jest.fn(),
    } as any as PushMapService;
    mockKbFileService = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 2,
          fielPath: '/tmp/xxx/2.md',
        },
        {
          id: 3,
          fielPath: '/tmp/xxx/3.md',
        },
        {
          id: 10000,
          fielPath: '/tmp/xxx/10000.md',
        },
      ]),
    } as any as KbFileService;
    mockKbService = {
      getKbRoot: jest.fn().mockResolvedValue('/tmp/xxx'),
      findByPk: jest.fn().mockResolvedValue({}),
      safeJoinPath: jest
        .fn()
        .mockImplementation((start, filePath) => `${start}/${filePath}`),
    } as any as KbService;
    mockPushProcessService = {
      deleteByFile: jest.fn().mockResolvedValue('delete'),
      getAllRemoteIds: jest.fn().mockResolvedValue(['remote1', 'remote2']),
    } as any as PushProcessService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushController],
      providers: [
        { provide: PushConfigService, useValue: mockPushConfigService },
        { provide: PushMapService, useValue: mockPushMapService },
        { provide: PushLogService, useValue: mockPushLogService },
        { provide: PushProcessService, useValue: mockPushProcessService },
        { provide: KbService, useValue: mockKbService },
        { provide: KbFileService, useValue: mockKbFileService },
        { provide: I18nService, useValue: {} },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: { error: jest.fn(), warn: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<PushController>(PushController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Add more tests here for each method in your controller
  describe('_runBefore', () => {
    it('should create a new push log if the push version is different', async () => {
      mockPushLogService.findLastOne = jest
        .fn()
        .mockResolvedValueOnce({ pushVersion: 'v1' })
        .mockResolvedValueOnce(null);
      mockPushLogService.create = jest.fn().mockResolvedValue({});

      await (controller as any)._runBefore(
        1,
        { pushVersion: 'v2' },
        {},
        { id: 1 },
      );

      expect(mockPushLogService.create).toHaveBeenCalled();
    });

    it('should not create a new push log if the push version is the same', async () => {
      mockPushLogService.findLastOne = jest
        .fn()
        .mockResolvedValue({ pushVersion: 'v1' });
      mockPushLogService.create = jest.fn().mockResolvedValue({});

      await (controller as any)._runBefore(
        1,
        { pushVersion: 'v1' },
        {},
        { id: 1 },
      );

      expect(mockPushLogService.create).not.toHaveBeenCalled();
    });

    it('should not create a new push log if the push version is exists', async () => {
      mockPushLogService.findLastOne = jest
        .fn()
        .mockResolvedValueOnce({ pushVersion: 'v2' })
        .mockResolvedValueOnce({ pushVersion: 'v1' });
      mockPushLogService.create = jest.fn().mockResolvedValue({});

      await expect(() =>
        (controller as any)._runBefore(1, { pushVersion: 'v1' }, {}, { id: 1 }),
      ).rejects.toThrow(`pushVersion: v1 is exists, please change pushVersion`);
    });
  });

  describe('_removeResidualDataFromPushMap', () => {
    it('should call deleteByFile and removeByPk for each item in pushMapDict', async () => {
      const pushMapDict = {
        1: { id: 1, remoteId: 'remote1' },
        2: { id: 2, remoteId: 'remote2' },
        3: { id: 3, remoteId: 'remote3' },
      };
      const pushConfig = { pushVersion: 'v1' };

      await (controller as any)._removeResidualDataFromPushMap(
        pushMapDict,
        pushConfig,
      );

      expect(mockPushProcessService.deleteByFile).toHaveBeenCalledTimes(3);
      expect(mockPushMapService.removeByPk).toHaveBeenCalledTimes(3);
    });

    it('should not call deleteByFile and removeByPk if pushMapDict is empty', async () => {
      const pushMapDict = {};
      const pushConfig = { pushVersion: 'v1' };

      await (controller as any)._removeResidualDataFromPushMap(
        pushMapDict,
        pushConfig,
      );

      expect(mockPushProcessService.deleteByFile).not.toHaveBeenCalled();
      expect(mockPushMapService.removeByPk).not.toHaveBeenCalled();
    });
  });

  describe('_pushFileAndUpsertPushMap', () => {
    it('should call pushByFile and create if remoteId not exists', async () => {
      const pushVersion = 'v1';
      const absFilePath = '/tmp/xxx/1.md';
      const pushConfig = { id: 1, type: 'type1', kbId: 1 };
      const pushMapDict = {};
      const owner = { id: 1 };
      const kbFileId = 1;

      mockPushProcessService.pushByFile = jest
        .fn()
        .mockResolvedValue('remote1');
      mockPushMapService.create = jest.fn().mockResolvedValue({});

      await (controller as any)._pushFileAndUpsertPushMap(
        pushVersion,
        absFilePath,
        pushConfig,
        pushMapDict,
        owner,
        kbFileId,
      );

      expect(mockPushProcessService.pushByFile).toHaveBeenCalledWith(
        absFilePath,
        pushConfig,
        '',
      );
      const newMap = {
        configId: pushConfig.id,
        type: pushConfig.type,
        fileId: kbFileId,
        remoteId: 'remote1',
        pushVersion: pushVersion,
      };

      expect(mockPushMapService.create).toHaveBeenCalledWith(
        newMap,
        pushConfig.kbId,
        owner.id,
      );
    });

    it('should call pushByFile and updateByPk if remoteId exists', async () => {
      const pushVersion = 'v1';
      const absFilePath = '/tmp/xxx/1.md';
      const pushConfig = { id: 1, type: 'type1', kbId: 1 };
      const pushMapDict = { 1: { id: 1, remoteId: 'remote1' } };
      const owner = { id: 1 };
      const kbFileId = 1;

      mockPushProcessService.pushByFile = jest
        .fn()
        .mockResolvedValue('remote1');
      mockPushMapService.updateByPk = jest.fn().mockResolvedValue({});

      await (controller as any)._pushFileAndUpsertPushMap(
        pushVersion,
        absFilePath,
        pushConfig,
        pushMapDict,
        owner,
        kbFileId,
      );

      expect(mockPushProcessService.pushByFile).toHaveBeenCalledWith(
        absFilePath,
        pushConfig,
        'remote1',
      );
      expect(mockPushMapService.updateByPk).toHaveBeenCalledWith(1, {
        pushVersion: pushVersion,
      });
    });
  });

  describe('run', () => {
    it('should run the push flow correctly', async () => {
      const configId = 1;
      const pushOption = { pushVersion: 'v1' };
      const owner = { id: 1 } as any;
      const pushConfig = { id: 1 };
      const kbResRoot = '/tmp/xxx';
      const files = [
        { id: 1, filePath: '1.md' },
        { id: 2, filePath: '2.md' },
      ];
      const pushMapDict = {
        1: { id: 1, remoteId: 'remote1' },
      };

      mockPushConfigService.findByPk = jest.fn().mockResolvedValue(pushConfig);

      controller['check_owner'] = jest.fn();
      controller['_runBefore'] = jest
        .fn()
        .mockResolvedValue({ kbResRoot, files, pushMapDict });

      controller['_pushFileAndUpsertPushMap'] = jest
        .fn()
        .mockResolvedValue('remote1');
      controller['_removeResidualDataFromPushMap'] = jest
        .fn()
        .mockResolvedValue({});

      const result = await controller.run(configId, pushOption, owner);

      await new Promise((resolve) => {
        result.subscribe({
          next: (value) => {
            expect(value).toHaveProperty('data');
            expect(value.data).toHaveProperty('remoteId');
            expect(value.data).toHaveProperty('fileId');
            expect(value.data).toHaveProperty('finish');
            expect(value.data).toHaveProperty('total');
            expect(value.data).toHaveProperty('index');
          },
          error(error) {
            // const data = x.data as CrawlerResultDto;
            // errorList.push(data);
            console.error('发生错误: ' + error);
          },
          complete: () => {
            expect((controller as any)._runBefore).toHaveBeenCalledWith(
              configId,
              pushOption,
              pushConfig,
              owner,
            );
            expect(
              (controller as any)._pushFileAndUpsertPushMap,
            ).toHaveBeenCalledTimes(files.length);

            expect(
              (controller as any)._removeResidualDataFromPushMap,
            ).toHaveBeenCalledWith(pushMapDict, pushConfig);
            resolve('');
          },
        });
      });
    });

    it('should skip ignored files', async () => {
      const configId = 1;
      const pushOption = { pushVersion: 'v1' };
      const owner = { id: 1 } as any;
      const pushConfig = { id: 1 };
      const kbResRoot = '/tmp/xxx';
      const files = [{ id: 2, filePath: '2.md' }];
      const pushMapDict = {};

      mockPushConfigService.findByPk = jest.fn().mockResolvedValue(pushConfig);
      (controller as any).check_owner = jest.fn();
      (controller as any)._runBefore = jest
        .fn()
        .mockResolvedValue({ kbResRoot, files, pushMapDict });
      (controller as any)._pushFileAndUpsertPushMap = jest
        .fn()
        .mockResolvedValue('remote1');
      (controller as any)._removeResidualDataFromPushMap = jest
        .fn()
        .mockResolvedValue({});

      const result = await controller.run(configId, pushOption, owner);

      await new Promise((done) => {
        result.subscribe({
          complete: () => {
            expect(
              (controller as any)._pushFileAndUpsertPushMap,
            ).toHaveBeenCalledTimes(files.length);
            done('');
          },
        });
      });
    });
  });

  describe('clearAll', () => {
    it('should clearAll correctly', async () => {
      const configId = 1;
      const pushOption = { pushVersion: 'v1' };
      const owner = { id: 1 } as any;
      const pushConfig = { id: 1, type: 'dify', kbId: 1 };
      const allMaps = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ];

      mockPushConfigService.findByPk = jest.fn().mockResolvedValue(pushConfig);
      mockPushMapService.findAll = jest.fn().mockResolvedValue(allMaps);
      mockPushProcessService.deleteByFile = jest.fn();

      (controller as any).check_owner = jest.fn();

      await controller.clearAll(configId, pushOption, owner);

      expect(mockPushConfigService.findByPk).toHaveBeenCalledWith(configId);

      expect(mockPushLogService.create).toHaveBeenCalledWith(
        {
          configId,
          type: pushConfig.type,
          pushVersion: pushOption.pushVersion,
        },
        pushConfig.kbId,
        owner.id,
      );

      expect(mockPushProcessService.deleteByFile).toHaveBeenCalledTimes(
        allMaps.length,
      );
    });

    it('should clearAll with deleteByFile failed', async () => {
      const configId = 1;
      const pushOption = { pushVersion: 'v1' };
      const owner = { id: 1 } as any;
      const pushConfig = { id: 1, type: 'dify', kbId: 1 };
      const allMaps = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ];

      mockPushConfigService.findByPk = jest.fn().mockResolvedValue(pushConfig);
      mockPushMapService.findAll = jest.fn().mockResolvedValue(allMaps);
      mockPushProcessService.deleteByFile = jest
        .fn()
        .mockRejectedValueOnce('err');

      (controller as any).check_owner = jest.fn();

      const actual = await controller.clearAll(configId, pushOption, owner);

      expect(mockPushConfigService.findByPk).toHaveBeenCalledWith(configId);

      expect(mockPushLogService.create).toHaveBeenCalledWith(
        {
          configId,
          type: pushConfig.type,
          pushVersion: pushOption.pushVersion,
        },
        pushConfig.kbId,
        owner.id,
      );

      expect(mockPushProcessService.deleteByFile).toHaveBeenCalledTimes(
        allMaps.length,
      );

      expect(actual.deleteRemoteIds.length).toEqual(1);
      expect(actual.deleteFailedRemoteIds.length).toEqual(1);
    });

    it('should clearAll with empty', async () => {
      const configId = 1;
      const pushOption = { pushVersion: 'v1' };
      const owner = { id: 1 } as any;
      const pushConfig = { id: 1, type: 'dify', kbId: 1 };

      mockPushConfigService.findByPk = jest.fn().mockResolvedValue(pushConfig);
      mockPushMapService.findAll = jest.fn().mockResolvedValue([]);
      mockPushProcessService.getAllRemoteIds = jest.fn().mockResolvedValue([]);

      (controller as any).check_owner = jest.fn();

      const actual = await controller.clearAll(configId, pushOption, owner);

      expect(mockPushConfigService.findByPk).toHaveBeenCalledWith(configId);

      expect(mockPushProcessService.deleteByFile).not.toHaveBeenCalled();

      expect(actual.message).toEqual('no data need clear');
      expect(actual.deleteRemoteIds.length).toEqual(0);
      expect(actual.deleteFailedRemoteIds.length).toEqual(0);
    });
  });
});
