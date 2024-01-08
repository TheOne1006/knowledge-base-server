/**
 * url 添加后缀
 * @param url
 * @param suffix
 * @returns
 */
export function urlAppendSuffix(url: string, suffix: string = '.html'): URL {
  const urlObj = new URL(url);
  let urlPath = urlObj.pathname;

  // 判断 urlPath 是否以 / 结尾,则去除 '/'
  if (urlPath.endsWith('/')) {
    urlPath = urlPath.substring(0, urlPath.length - 1);
  }

  // 判断 urlPath 是否 有 ., 如果没有, 则添加 .html
  if (!urlPath.includes('.')) {
    urlPath += suffix;
  }

  urlObj.pathname = urlPath;
  return urlObj;
}
