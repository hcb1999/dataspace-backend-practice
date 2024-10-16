import { DataSource } from "typeorm";
import { PurchaseAsset } from "../entities/purchase_asset.entity";
import { Product } from "../entities/product.entity";
import { NftMint } from "../entities/nft_mint.entity";
import { Asset } from "../entities/asset.entity";

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
        provide: 'NFT_MINT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftMint),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'ASSET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Asset),
        inject: ['DATA_SOURCE'],
    }
]