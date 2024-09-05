import { DataSource } from "typeorm";
import { AssetType } from "../entities/asset_type.entity";

export const AssetTypeProviders = [
    {
        provide: 'ASSET_TYPE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(AssetType),
        inject: ['DATA_SOURCE'],
    }
]