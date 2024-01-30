import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'knowledge_base_push_maps',
  version: true,
})
export class PushMap extends Model<PushMap> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'config_id',
  })
  configId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'file_id',
  })
  fileId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'remote_id',
  })
  remoteId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  type: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'push_version',
  })
  pushVersion: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'push_checksum',
  })
  pushChecksum: string;

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
