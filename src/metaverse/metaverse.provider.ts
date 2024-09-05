import { DataSource } from "typeorm";
import { Metaverse } from "../entities/metaverse.entity";

export const MetaverseProviders = [
    {
        provide: 'METAVERSE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Metaverse),
        inject: ['DATA_SOURCE'],
    }
]