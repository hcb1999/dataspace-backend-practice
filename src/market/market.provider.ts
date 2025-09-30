import { DataSource } from "typeorm";
import { Market } from "../entities/market.entity";
import { EContract } from "../entities/contract.entity";
import { Purchase } from "../entities/purchase.entity";
import { Product } from "../entities/product.entity";
import { NftWallet } from "../entities/nft_wallet.entity";
import { DidWallet } from "../entities/did_wallet.entity";
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { Asset } from "../entities/asset.entity";
import { State } from "../entities/state.entity";

export const MarketProviders = [
    {
        provide: 'MARKET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Market),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'CONTRACT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(EContract),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'PURCHASE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Purchase),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'PRODUCT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Product),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'NFT_WALLET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NftWallet),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'DID_WALLET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(DidWallet),
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
        provide: 'ASSET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Asset),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'STATE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(State),
        inject: ['DATA_SOURCE'],
    }
]