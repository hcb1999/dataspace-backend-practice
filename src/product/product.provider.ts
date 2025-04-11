import { DataSource } from "typeorm";
import { Product } from "../entities/product.entity";
import { EContract } from "../entities/contract.entity";
import { State } from "../entities/state.entity";
import { Advertiser } from "../entities/advertiser.entity";

export const ProductProviders = [
    {
        provide: 'PRODUCT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Product),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'CONTRACT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(EContract),
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