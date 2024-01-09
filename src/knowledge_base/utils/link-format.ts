/**
 * url 添加后缀
 * @param url
 * @param suffix
 * @returns
 */
export function urlAppendSuffix(
  url: string | URL,
  suffix: string = '.html',
): URL {
  let urlObj: URL;
  if (typeof url === 'string') {
    urlObj = new URL(url);
  } else {
    urlObj = url;
  }
  let urlPath = urlObj.pathname;

  // 判断 urlPath 是否以 / 结尾,则去除 '/'
  if (urlPath.endsWith('/')) {
    urlPath = urlPath.substring(0, urlPath.length - 1);
  }

  // 兼容 https://nestjs.com/ -> https://nestjs.com/index.html
  if (urlPath == '') {
    urlPath = 'index.html';
  }

  // 判断 urlPath 是否 有 ., 如果没有, 则添加 .html
  if (!urlPath.includes('.')) {
    urlPath += suffix;
  }

  urlObj.pathname = urlPath;
  return urlObj;
}

/**
 * url 删除 # 后面的内容
 * @param url
 * @returns
 */
export function urlRemoveHash(url: string | URL): URL {
  let urlObj: URL;
  if (typeof url === 'string') {
    urlObj = new URL(url);
  } else {
    urlObj = url;
  }

  urlObj.hash = '';
  return urlObj;
}

/**
 * 转换为绝对 url
 * @param base
 * @param relative
 * @returns
 */
export function toAbsoluteURL(base: string, relative: string) {
  return new URL(relative, base).href;
}
