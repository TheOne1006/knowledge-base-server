import { Column, Model, Table, DataType } from 'sequelize-typescript';

/**
 * todo 扩展元素 增加标记信息
 */
@Table({
  tableName: 'knowledge_base_files',
  version: true,
})
export class KnowledgeBaseFile extends Model<KnowledgeBaseFile> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'file_path',
  })
  filePath: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'file_ext' })
  fileExt: string;

  @Column({
    type: DataType.INTEGER,
    field: 'kb_id',
  })
  kbId: number;

  @Column({
    type: DataType.INTEGER,
    field: 'owner_id',
  })
  ownerId: number;

  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt: Date;

  @Column({ type: DataType.DATE, field: 'updated_at' })
  updatedAt: Date;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  version: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, field: 'is_deleted' })
  isDeleted: boolean;
}
