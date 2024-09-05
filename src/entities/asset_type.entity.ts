import { Entity, BaseEntity, Column, CreateDateColumn, UpdateDateColumn, Index, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "ar_asset_type" })
export class AssetType extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "type_no", comment: "에셋 타입 번호" })
  typeNo: number;

  @Index()
  @Column({ name: "metaverse_no", type: "int4", comment: "메타버스 업체 번호" })
  metaverseNo: number;

  @Index()
  @Column({ name: "metaverse_asset_type_no", type: "int4", comment: "메타버스 업체별 에셋 타입 번호" })
  metaverseAssetTypeNo: number;

  @Column({ name: "type_def", type: "varchar", length: 256, comment: "에셋 타입 정의" })
  typeDef: string;

  @Column({ name: "asset_type_desc", type: "varchar", length: 256, comment: "에셋 타입 설명", nullable: true })
  assetTypeDesc: string;

  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "사용 여부",  default: "Y" })
  useYn: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}