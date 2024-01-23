import { I18nService } from 'nestjs-i18n';
import { Op } from 'sequelize';
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
      t: jest.fn().mockReturnValue('error.INS_NOT_OWNER'),
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
      expect(i18n.t).toHaveBeenCalledWith('error.INS_NOT_OWNER');
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
      expect(i18n.t).toHaveBeenCalledWith('error.INS_NOT_OWNER');
    });
  });

  describe('buildSearchWhere', () => {
    it('should correctly add exact search parameters', () => {
      const where = {};
      const exactSearch = { key1: 'value1', key2: 'value2' };
      const result = controller['buildSearchWhere'](where, exactSearch);
      expect(result).toEqual(exactSearch);
    });

    it('should correctly add fuzzy match parameters', () => {
      const where = {};
      const fuzzyMatch = { key1: 'value1', key2: 'value2' };
      const expected = {
        key1: { [Op.like]: '%value1%' },
        key2: { [Op.like]: '%value2%' },
      };
      const result = controller['buildSearchWhere'](where, {}, fuzzyMatch);
      expect(result).toEqual(expected);
    });

    it('should correctly combine exact search and fuzzy match parameters', () => {
      const where = {};
      const exactSearch = { key1: 'value1' };
      const fuzzyMatch = { key2: 'value2' };
      const expected = {
        key1: 'value1',
        key2: { [Op.like]: '%value2%' },
      };
      const result = controller['buildSearchWhere'](
        where,
        exactSearch,
        fuzzyMatch,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('buildSearchOffsetAndLimit', () => {
    const table = [
      {
        _title: 'should correctly calculate offset and limit',
        start: 1,
        end: 10,
        expected: [1, 9],
      },
      {
        _title: 'should correctly calculate offset and limit when start is 0',
        start: 0,
        end: 10,
        expected: [0, 10],
      },
      {
        _title: 'should correctly calculate offset and limit when end is 0',
        start: 1,
        end: 0,
        expected: [1, 0],
      },
      {
        _title:
          'should correctly calculate offset and limit when start and end are 0',
        start: 0,
        end: 0,
        expected: [0, 0],
      },
    ];

    describe.each(table)(
      'buildSearchOffsetAndLimit each',
      ({ _title, start, end, expected }) => {
        it(_title, () => {
          const result = controller['buildSearchOffsetAndLimit'](start, end);
          expect(result).toEqual(expected);
        });
      },
    );
  });

  describe('buildSearchOrder', () => {
    const table = [
      {
        _title: 'should correctly build order',
        sort: 'key1',
        order: 'ASC',
        expected: ['key1', 'ASC'],
      },
      {
        _title: 'should correctly build order when sort is undefined',
        sort: undefined,
        order: 'ASC',
        expected: undefined,
      },
      {
        _title: 'should correctly build order when order is undefined',
        sort: 'key1',
        order: undefined,
        expected: ['key1', 'ASC'],
      },
      {
        _title:
          'should correctly build order when sort and order are undefined',
        sort: undefined,
        order: undefined,
        expected: undefined,
      },
    ];

    describe.each(table)(
      'buildSearchOrder each',
      ({ _title, sort, order, expected }) => {
        it(_title, () => {
          const result = controller['buildSearchOrder'](sort, order);
          expect(result).toEqual(expected);
        });
      },
    );
  });
});
