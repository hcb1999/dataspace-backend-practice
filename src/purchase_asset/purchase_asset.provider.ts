import { DataSource } from "typeorm";
import { PurchaseAsset } from "../entities/purchase_asset.entity";
import { Product } from "../entities/product.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";

export const PurchaseAssetProviders = [
    {
        provide: 'PURCHASE_ASSET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(PurchaseAsset),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'PRODUCT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Product),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'NFT_TRANSFER_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftTransfer),
        inject: ['DATA_SOURCE'],
    }
]