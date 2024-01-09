export class CrawlerResultDto {
  url: string; // 当前 url
  completed: boolean; // 是否完成
  retry: number;
  finish: false;
  total: number;
  index: number;
}
