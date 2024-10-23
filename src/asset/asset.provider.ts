import { DataSource } from "typeorm";
import { Asset } from "../entities/asset.entity";
import { Creator } from "../entities/creator.entity";
import { State } from "../entities/state.entity";
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { Product } from "../entities/product.entity";
import { Metaverse } from "../entities/metaverse.entity";
import { AssetType } from "../entities/asset_type.entity";

export const AssetProviders = [
    {
        provide: 'ASSET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Asset),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'STATE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(State),
        inject: ['DATA_SOURCE'],
    },{

        provide: 'NFT_MINT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftMint),
        inject: ['DATA_SOURCE'],
    },{

        provide: 'NFT_TRANSFER_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftTransfer),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'PRODUCT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Product),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'METAVERSE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Metaverse),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'ASSET_TYPE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(AssetType),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'CREATOR_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Creator),
        inject: ['DATA_SOURCE'],
    }
]