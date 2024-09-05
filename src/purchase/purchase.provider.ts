import { DataSource } from "typeorm";
import { Purchase } from "../entities/purchase.entity";
import { PurchaseAsset } from "../entities/purchase_asset.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";

export const PurchaseProviders = [
    {
        provide: 'PURCHASE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Purchase),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'PURCHASE_ASSET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(PurchaseAsset),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'NFT_TRANSFER_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftTransfer),
        inject: ['DATA_SOURCE'],
    }
]