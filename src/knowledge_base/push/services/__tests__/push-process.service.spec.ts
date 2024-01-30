import { Test, TestingModule } from '@nestjs/testing';
import { PushProcessService } from '../push-process.service';
import { PushDifyService } from '../dify';
import { PUSH_TYPE_DIFY } from '../../constants';
import { PushConfigDto } from '../../dtos';

describe('PushProcessService', () => {
  let service: PushProcessService;
  let difyService: PushDifyService;
  let module: TestingModule;
  let mockDifyService: PushDifyService;

  beforeEach(async () => {
    mockDifyService = {
      createByFile: jest.fn().mockResolvedValue({
        id: 'remoteId',
      }),
      updateByFile: jest.fn().mockResolvedValue({
        id: 'remoteId',
      }),
      checkConfig: jest.fn().mockResolvedValue(true),
      deleteByFile: jest.fn().mockResolvedValue('success'),
      queryAllDocuments: jest
        .fn()
        .mockResolvedValue([{ id: 'remoteId1' }, { id: 'remoteId2' }]),
    } as any as PushDifyService;

    module = await Test.createTestingModule({
      providers: [
        PushProcessService,
        {
          provide: PushDifyService,
          useValue: mockDifyService,
        },
      ],
    }).compile();

    service = module.get<PushProcessService>(PushProcessService);
    difyService = module.get<PushDifyService>(PushDifyService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkConfig', () => {
    it('should throw an error if type is not PUSH_TYPE_DIFY', () => {
      const configIns = {
        type: 'other',
        apiUrl: 'apiUrl',
        apiKey: 'apiKey',
      } as PushConfigDto;

      expect(() => service['checkConfig'](configIns)).toThrow(
        'type is not allow',
      );
    });

    it('should throw an error if apiUrl is empty', () => {
      const configIns = {
        type: PUSH_TYPE_DIFY,
        apiUrl: '',
        apiKey: 'apiKey',
      } as PushConfigDto;

      expect(() => (service as any).checkConfig(configIns)).toThrow(
        'apiUrl or apiKey is not allow empty',
      );
    });

    it('should throw an error if apiKey is empty', () => {
      const configIns = {
        type: PUSH_TYPE_DIFY,
        apiUrl: 'apiUrl',
        apiKey: '',
      } as PushConfigDto;

      expect(() => (service as any).checkConfig(configIns)).toThrow(
        'apiUrl or apiKey is not allow empty',
      );
    });

    it('should not throw an error if type is PUSH_TYPE_DIFY and apiUrl and apiKey are not empty', () => {
      const configIns = {
        type: PUSH_TYPE_DIFY,
        apiUrl: 'apiUrl',
        apiKey: 'apiKey',
      } as PushConfigDto;

      expect(() => (service as any).checkConfig(configIns)).not.toThrow();
    });
  });

  describe('pushByFile', () => {
    it('should call the correct method based on type', async () => {
      const filePath = 'testPath';
      const configIns = {
        apiUrl: 'apiUrl',
        type: PUSH_TYPE_DIFY,
        apiKey: 'apiKey',
        additional: {},
      } as any;
      const remoteId = 'remoteId';

      await service.pushByFile(filePath, configIns, remoteId);

      expect(mockDifyService.createByFile).not.toHaveBeenCalled();
      expect(mockDifyService.updateByFile).toHaveBeenCalledWith(
        configIns.apiUrl,
        remoteId,
        filePath,
        configIns.apiKey,
        {},
      );
    });

    it('should call the correct method without remoteId', async () => {
      const filePath = 'testPath';
      const configIns = {
        apiUrl: 'apiUrl',
        type: PUSH_TYPE_DIFY,
        apiKey: 'apiKey',
      } as any;

      await service.pushByFile(filePath, configIns);

      expect(mockDifyService.updateByFile).not.toHaveBeenCalled();
      expect(mockDifyService.createByFile).toHaveBeenCalledWith(
        configIns.apiUrl,
        filePath,
        configIns.apiKey,
        undefined,
      );
    });

    it('should call the error method based on type', async () => {
      const filePath = 'testPath';
      const configIns = {
        apiUrl: 'apiUrl',
        type: 'other',
        apiKey: 'apiKey',
        additional: {},
      } as PushConfigDto;
      const remoteId = 'remoteId';

      await expect(
        service.pushByFile(filePath, configIns, remoteId),
      ).rejects.toThrow('type is not allow');
    });
  });

  describe('createByFile', () => {
    it('should call the correct method', async () => {
      const filePath = 'testPath';
      const configIns = {
        apiUrl: 'apiUrl',
        type: PUSH_TYPE_DIFY,
        apiKey: 'apiKey',
        additional: {},
      } as PushConfigDto;

      await (service as any).createByFile(filePath, configIns);

      expect(difyService.createByFile).toHaveBeenCalledWith(
        configIns.apiUrl,
        filePath,
        configIns.apiKey,
        {},
      );
    });
  });

  describe('updateByFile', () => {
    it('should call the correct method', async () => {
      const filePath = 'testPath';
      const configIns = {
        apiUrl: 'apiUrl',
        type: PUSH_TYPE_DIFY,
        apiKey: 'apiKey',
        additional: {},
      } as PushConfigDto;
      const remoteId = 'remoteId';

      await (service as any).updateByFile(remoteId, filePath, configIns);

      expect(difyService.updateByFile).toHaveBeenCalledWith(
        configIns.apiUrl,
        remoteId,
        filePath,
        configIns.apiKey,
        {},
      );
    });
  });

  describe('deleteByFile', () => {
    it('should call the correct method', () => {
      const configIns = {
        apiUrl: 'apiUrl',
        type: PUSH_TYPE_DIFY,
        apiKey: 'apiKey',
      } as PushConfigDto;
      const remoteId = 'remoteId';

      service.deleteByFile(remoteId, configIns);

      expect(difyService.deleteByFile).toHaveBeenCalledWith(
        configIns.apiUrl,
        remoteId,
        configIns.apiKey,
      );
    });
  });

  describe('getAllRemoteIds', () => {
    it('should return all remote ids if config type is PUSH_TYPE_DIFY', async () => {
      const configIns = {
        type: PUSH_TYPE_DIFY,
        apiUrl: 'apiUrl',
        apiKey: 'apiKey',
      } as PushConfigDto;

      const result = await service.getAllRemoteIds(configIns);
      expect(result).toEqual(['remoteId1', 'remoteId2']);
      expect(difyService.queryAllDocuments).toHaveBeenCalledWith(
        configIns.apiUrl,
        configIns.apiKey,
      );
    });
  });
});
