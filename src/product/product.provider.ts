import { DataSource } from "typeorm";
import { Product } from "../entities/product.entity";
// import { Asset } from "../entities/asset.entity";
// import { NftMint } from "../entities/nft_mint.entity";
// import { Purchase } from "../entities/purchase.entity";
import { PurchaseAsset } from "../entities/purchase_asset.entity";
import { State } from "../entities/state.entity";
import { Advertiser } from "../entities/advertiser.entity";

export const ProductProviders = [
    {
        provide: 'PRODUCT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Product),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'PURCHASE_ASSET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(PurchaseAsset),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'STATE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(State),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'ADVERTISER_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Advertiser),
        inject: ['DATA_SOURCE'],
    }
]