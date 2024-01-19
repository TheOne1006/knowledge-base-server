/**
 * dify 文档 dto
 */
export class DifyDocumentDto {
  id: string;
  indexing_status: string;
  name: string;
  position: number;
  tokens: number;
  word_count: number;
  // 归档
  archived: boolean;
  // 状态
  display_status: string;
  doc_form: string;
  // 是否可用
  enabled: boolean;
  error: any;
  // data source 详情
  data_source_info: {
    // 文件上传id
    upload_file_id: string;
  };
  // 数据来源
  data_source_type: string;

  // 处理规则id
  dataset_process_rule_id: string;

  // 创建于什么时间
  created_at: number;

  // 创建于哪里
  created_from: string;

  disabled_at: number;
  disabled_by: any;
}

/**
 * dify 文档 page dto
 */
export class DifyDocumentPageDto {
  data: DifyDocumentDto[];
  has_more: boolean;
  limit: number;
  total: number;
  page: number;
}
