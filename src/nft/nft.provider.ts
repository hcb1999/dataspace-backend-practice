import { DataSource } from "typeorm";
import { NftBurn } from "../entities/nft_burn.entity";
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { NftWallet } from "../entities/nft_wallet.entity";
import { Asset } from "../entities/asset.entity";
import { PurchaseAsset } from "../entities/purchase_asset.entity";

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
        provide: 'PURCHASE_ASSET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(PurchaseAsset),
        inject: ['DATA_SOURCE'],
    }
]