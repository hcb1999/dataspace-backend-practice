import { Entity, BaseEntity, Column, UpdateDateColumn, PrimaryColumn, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "ar_did_wallet"})
export class DidWallet extends BaseEntity {
  @PrimaryColumn({name:"user_no", type:"int4", comment:"사용자 번호"})
  userNo: number;

  @Column({ name:"jwt", type:"varchar", length:256, comment:"jwt", nullable: true })
  jwt: string;

  @Column({ name:"wallet_did", type:"varchar", length:256, comment:"지갑 DID", nullable: true })
  walletDid: string;

  @CreateDateColumn({ type: 'timestamptz', name:"reg_dttm", comment:"등록일시" })
  regDttm: Date;
}