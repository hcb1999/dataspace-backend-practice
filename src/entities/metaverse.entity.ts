import { Entity, BaseEntity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "ar_metaverse" })
export class Metaverse extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "metaverse_no", comment: "메타버스 업체 번호" })
  metaverseNo: number;

  @Column({ name: "metaverse_name", type: "varchar", length: 256, comment: "메타버스 업체명" })
  metaverseName: string;

  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "사용 여부",  default: "Y" })
  useYn: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}