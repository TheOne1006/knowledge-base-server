import { I18nService } from 'nestjs-i18n';
import { BadRequestException } from '@nestjs/common';
import { BaseController } from '../base.controller';

export class BaseTestController extends BaseController {
  constructor(protected readonly i18n: I18nService) {
    super(i18n);
  }
}

describe('BaseController', () => {
  let controller: BaseController;
  let i18n: I18nService;

  beforeEach(async () => {
    i18n = {
      t: jest.fn().mockReturnValue('error.KB_NOT_OWNER'),
    } as any as I18nService;

    controller = new BaseTestController(i18n);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check_owner', () => {
    it('should throw BadRequestException if ownerId does not match', () => {
      const ins = { ownerId: 1 };
      const ownerId = 2;
      expect(() => (controller as any).check_owner(ins, ownerId)).toThrow(
        BadRequestException,
      );
      expect(i18n.t).toHaveBeenCalledWith('error.KB_NOT_OWNER');
    });

    it('should not throw BadRequestException if ownerId matches', () => {
      const ins = { ownerId: 1 };
      const ownerId = 1;
      expect(() => (controller as any).check_owner(ins, ownerId)).not.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if ins is undefined', () => {
      const ins = undefined;
      const ownerId = 1;
      expect(() => (controller as any).check_owner(ins, ownerId)).toThrow(
        BadRequestException,
      );
      expect(i18n.t).toHaveBeenCalledWith('error.KB_NOT_OWNER');
    });
  });
});
