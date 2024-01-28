import * as fs from 'fs/promises';
import { createHash } from 'crypto';

/**
 * 检查文件、目录是否存在
 * @param  {string} filePath
 * @returns {Promise<boolean>}
 */
export async function doesFileExist(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 检查目录是否存在, 如果不存在 则创建
 * @param  {string} dirPath
 * @returns {Promise<boolean>}
 */
export async function checkDir(dirPath: string): Promise<boolean> {
  const isExists = await doesFileExist(dirPath);

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
  const isExists = await doesFileExist(dirPath);

  if (isExists) {
    const stat = await fs.stat(dirPath);
    if (stat.isDirectory()) {
      await fs.rm(dirPath, { recursive: true });
    }
  }

  return true;
}

/**
 * 检查目录是否存在, 存在则删除该目录
 * @param  {string} filePath
 * @returns {Promise<boolean>}
 */
export async function removeFile(filePath: string): Promise<boolean> {
  const isExists = await doesFileExist(filePath);

  if (isExists) {
    const stat = await fs.stat(filePath);
    if (!stat.isDirectory()) {
      await fs.rm(filePath);
    }
  }

  return true;
}

/**
 * 生成文件的 hash 值
 * @param  {string} filePath
 * @returns {Promise<string>}
 */
export async function generateFileHash(filePath: string): Promise<string> {
  // 读取文件内容
  const fileData = await fs.readFile(filePath);

  // 使用SHA-256哈希函数生成唯一值
  const hash = createHash('sha256');
  hash.update(fileData);

  return hash.digest('hex');
}
