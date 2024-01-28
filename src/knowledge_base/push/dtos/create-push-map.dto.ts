/**
 * CreatePushMapDto
 */
export class CreatePushMapDto {
  configId: number;

  fileId: number;

  type: string;

  pushVersion: string;

  pushChecksum: string;

  remoteId: string;
}
