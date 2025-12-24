import { DataSource } from "typeorm";
import { Purchase } from "../entities/purchase.entity";
import { Market } from "../entities/market.entity";
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";

export const PurchaseProviders = [
    {
        provide: 'PURCHASE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Purchase),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'MARKET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Market),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'NFT_MINT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftMint),
        inject: ['DATA_SOURCE'],
    },{
        
        provide: 'NFT_TRANSFER_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftTransfer),
        inject: ['DATA_SOURCE'],
    }
]