import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'knowledge_base_sites',
  version: true,
})
export class KnowledgeBaseSite extends Model<KnowledgeBaseSite> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  desc: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  hostname: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  pattern: string;

  @Column({ type: DataType.JSON, allowNull: false, field: 'start_urls' })
  startUrls: string[];

  @Column({ type: DataType.JSON, allowNull: false, field: 'remove_selectors' })
  removeSelectors: string[];

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
