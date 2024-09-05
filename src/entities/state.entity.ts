import { Entity, BaseEntity, Column, CreateDateColumn, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity({ name: "ar_state" })
@Unique(['state'])
export class State extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "state_no", comment: "상태 번호" })
  stateNo: number;

  @Column({ name: "category", type: "varchar", length: 10, comment: "상태 분류" })
  category: string;

  @Column({ name: "state", type: "varchar", length: 10, comment: "상태값" })
  state: string;

  @Column({ name: "state_desc", type: "varchar", length: 256, comment: "상태 설명" })
  stateDesc: string;

  @Column({ name: "use_yn", type: "varchar", length: 1, comment: "사용 여부",  default: "Y" })
  useYn: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}