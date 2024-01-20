import * as fs from 'fs/promises';
import * as path from 'path';
import { FileStatDto } from './dtos';

/**
 * 递归文件新信息
 * @param dir 目录
 * @param ignorePathPrefix 忽略的路径信息
 * @returns
 */
export async function getAllFilesAndDirectoriesRecursively(
  dir: string,
  ignorePathPrefix = '',
): Promise<FileStatDto[]> {
  const children = await fs.readdir(dir);
  const files: FileStatDto[] = [];

  for (const item of children) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    const fullPathCrop = fullPath.replace(ignorePathPrefix, '');
    if (stat && stat.isDirectory()) {
      const children = await getAllFilesAndDirectoriesRecursively(
        fullPath,
        ignorePathPrefix,
      );
      files.push({
        name: item,
        path: fullPathCrop,
        isDir: true,
        children,
      });
    } else {
      // item 过滤掉 以 .开头的文件名
      if (!item.startsWith('.')) {
        files.push({
          name: item,
          path: fullPathCrop,
          isDir: false,
        });
      }
    }
  }
  return files;
}

/**
 * 展平所有 flatFileAndDirRecursively
 */
export function flatFileAndDirRecursively(files: FileStatDto[]): FileStatDto[] {
  const result: FileStatDto[] = [];
  files.forEach((item) => {
    if (item.isDir) {
      result.push(...flatFileAndDirRecursively(item.children));
    } else {
      result.push(item);
    }
  });
  return result;
}
