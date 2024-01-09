import * as fs from 'fs/promises';

/**
 * 检查目录是否存在, 如果不存在 则创建
 * @param  {string} dirPath
 * @returns {Promise<boolean>}
 */
export async function checkDir(dirPath: string): Promise<boolean> {
  let isExists = true;

  try {
    await fs.access(dirPath);
  } catch (error) {
    isExists = false;
  }
  if (!isExists) {
    await fs.mkdir(dirPath, { recursive: true });
  } else {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      throw new Error('dirPath is not a directory');
    }
  }

  return true;
}

/**
 * 检查目录是否存在, 存在则删除该目录
 * @param  {string} dirPath
 * @returns {Promise<boolean>}
 */
export async function removeDir(dirPath: string): Promise<boolean> {
  let isExists = true;

  try {
    await fs.access(dirPath);
  } catch (error) {
    isExists = false;
  }

  if (isExists) {
    const stat = await fs.stat(dirPath);
    if (stat.isDirectory()) {
      await fs.rmdir(dirPath, { recursive: true });
    }
  }

  return true;
}
