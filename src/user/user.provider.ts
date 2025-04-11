import { DataSource } from "typeorm";
import { User } from "../entities/user.entity";
import { NftWallet } from "../entities/nft_wallet.entity";
import { DidWallet } from "../entities/did_wallet.entity";

export const UserProviders = [
    {
        provide: 'USER_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'NFT_WALLET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftWallet),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'DID_WALLET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(DidWallet),
        inject: ['DATA_SOURCE'],
    }
]