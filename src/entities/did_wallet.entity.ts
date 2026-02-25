import { Entity, BaseEntity, Column, UpdateDateColumn, PrimaryColumn, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "ar_did_wallet"})
export class DidWallet extends BaseEntity {
  @PrimaryColumn({name:"user_no", type:"int4", comment:"사용자 번호"})
  userNo: number;

  @Column({ name:"jwt", type:"varchar", length:512, comment:"jwt", nullable: true })
  jwt: string;

  @Column({ name:"wallet_did", type:"varchar", length:256, comment:"지갑 DID", nullable: true })
  walletDid: string;

  @Column({ name:"vc_type", type:"varchar", length:10, comment:"VC 타입 (오스레저 발급 응답값)", nullable: true })
  vcType: string;

  @CreateDateColumn({ type: 'timestamptz', name:"reg_dttm", comment:"등록일시" })
  regDttm: Date;
}