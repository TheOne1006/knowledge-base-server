import { BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

export abstract class BaseController {
  constructor(protected readonly i18n: I18nService) {}

  /**
   * 判断该实例不属于 ownerId
   * @param ins
   * @param ownerId
   */
  protected check_owner(ins: any, ownerId: number) {
    if (ins?.ownerId !== ownerId) {
      const message = this.i18n.t('error.KB_NOT_OWNER');
      throw new BadRequestException(message);
    }
  }
}
