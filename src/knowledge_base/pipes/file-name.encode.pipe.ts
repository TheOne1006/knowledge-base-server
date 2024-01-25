import { PipeTransform } from '@nestjs/common';

function trans(value: Express.Multer.File) {
  if (!/[^\u0000-\u00ff]/.test(value.originalname)) {
    value.originalname = Buffer.from(value.originalname, 'latin1').toString(
      'utf8',
    );
  }
  return value;
}

export class FileNameEncodePipe implements PipeTransform {
  transform(value: Express.Multer.File | Express.Multer.File[]) {
    if (Array.isArray(value)) {
      return value.map(trans);
    }
    return trans(value);
  }
}
