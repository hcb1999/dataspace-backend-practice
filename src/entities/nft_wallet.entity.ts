import { Entity, BaseEntity, Column, UpdateDateColumn, PrimaryColumn, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "ar_nft_wallet"})
export class NftWallet extends BaseEntity {
  @PrimaryColumn({name:"user_no", type:"int4", comment:"사용자 번호"})
  userNo: number;

  @Column({ name:"wallet_id", type:"varchar", length:40, comment:"NFT 지갑ID", nullable: true })
  walletId: string;

  @Column({ name:"account", type:"varchar", length:80, comment:"NFT 계정", nullable: true })
  account: string;

  @Column({ name:"pkey", type:"varchar", length:256, comment:"NFT 계정의 Private Key", nullable: true })
  pkey: string;

  // @Column({ name: "charged_yn", type: "varchar", length: 1, comment: "충전 여부(Y:충전, N:비충전)", default: "N" })
  // chargedYn: string;
  
  @CreateDateColumn({ type: 'timestamptz', name:"reg_dttm", comment:"등록일시" })
  regDttm: Date;
}