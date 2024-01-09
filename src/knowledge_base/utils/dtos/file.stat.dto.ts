// istanbul ignore file
export class FileStatDto {
  /**
   * 文件名
   */
  name: string;
  /**
   * 文件路径
   */
  path: string;
  /**
   * 是否是目录
   */
  isDir: boolean;
  /**
   * 子目录
   */
  children?: FileStatDto[];
}
