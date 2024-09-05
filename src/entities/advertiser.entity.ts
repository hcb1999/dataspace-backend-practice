import { Entity, BaseEntity, Column, UpdateDateColumn, CreateDateColumn, PrimaryColumn, Unique, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "ar_advertiser" })
export class Advertiser extends BaseEntity {
  @PrimaryColumn({ name: "user_no", comment: "광고주 사용자번호" })
  userNo: number;

  @Column({ name:"adv_name", type: "varchar", length: 40, comment: "광고주명" })
  advName: string;

  @Column({ name: "adv_phone", type: "varchar", length: 16, comment: "광고주 휴대폰 번호", nullable: true })
  advPhone: string;

  @Column({ name:"manager_name", type: "varchar", length: 40, comment: "담당자명", nullable: true })
  managerName: string;

  @Column({ name: "manager_phone", type: "varchar", length: 16, comment: "담당자 휴대폰 번호", nullable: true })
  managerPhone: string;

  @Column({ name: "manager_email", type: "varchar", length: 80, comment: "담당자 이메일", nullable: true })
  managerEmail: string;

  @CreateDateColumn({ type: 'timestamptz', name: "reg_dttm", comment: "등록일시" })
  regDttm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "upd_dttm", comment: "수정일시" })
  updDttm: Date;
}