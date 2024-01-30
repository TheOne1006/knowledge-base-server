// istanbul ignore file
/**
 * @interface imageTransType
 */

export const IMAGE_TRANS_TYPE_SKIP = 'ignore';
export const IMAGE_TRANS_TYPE_TMP_URL = 'tmpUrl';
export const IMAGE_TRANS_TYPE_BASE64 = 'base64';

export type IMAGE_TRANS_TYPES =
  | typeof IMAGE_TRANS_TYPE_SKIP
  | typeof IMAGE_TRANS_TYPE_TMP_URL
  | typeof IMAGE_TRANS_TYPE_BASE64;
