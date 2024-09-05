import { Entity, BaseEntity, Column, UpdateDateColumn, CreateDateColumn, PrimaryColumn, Unique, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "ar_creator" })
export class Creator extends BaseEntity {
  @PrimaryColumn({ name: "user_no", comment: "크리에이터 사용자번호" })
  userNo: number;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}