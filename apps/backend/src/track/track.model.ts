import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'tracks',
  timestamps: true,
})
export class Track extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  url!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  uploadedBy!: string;
}