import { DataSource } from "typeorm";
import { NftBurn } from "../entities/nft_burn.entity";
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { NftWallet } from "../entities/nft_wallet.entity";
import { Asset } from "../entities/asset.entity";
import { Market } from "../entities/market.entity";
import { EContract } from "../entities/contract.entity";
import { Purchase } from "../entities/purchase.entity";

export const NftProviders = [
    {
        provide: 'NFT_BURN_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftBurn),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'NFT_MINT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftMint),
        inject: ['DATA_SOURCE'],
    }, {
        provide: 'NFT_TRANSFER_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftTransfer),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'NFT_WALLET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftWallet),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'ASSET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Asset),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'CONTRACT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(EContract),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'MARKET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Market),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'PURCHASE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Purchase),
        inject: ['DATA_SOURCE'],
    }
]