import { Entity, BaseEntity, Column, UpdateDateColumn, PrimaryColumn, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "ar_nft_wallet"})
export class NftWallet extends BaseEntity {
  @PrimaryColumn({name:"user_no", type:"int4", comment:"사용자 번호"})
  userNo: number;

  @Column({ name:"wallet_id", type:"varchar", length:40, comment:"NFT 지갑ID", nullable: true })
  walletId: string;

  @Column({ name:"addr", type:"varchar", length:80, comment:"NFT 지갑주소" })
  addr: string;

  @CreateDateColumn({ type: 'timestamptz', name:"reg_dttm", comment:"등록일시" })
  regDttm: Date;
}