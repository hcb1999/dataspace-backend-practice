import { DataSource } from "typeorm";
import { State } from "../entities/state.entity";

export const StateProviders = [
    {
        provide: 'STATE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(State),
        inject: ['DATA_SOURCE'],
    }
]