import { DataSource } from "typeorm";
import { DidWallet } from "../entities/did_wallet.entity";
import { User } from "../entities/user.entity";
import { State } from "../entities/state.entity";

export const DidProviders = [
    {
        provide: 'STATE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(State),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'DID_WALLET_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(DidWallet),
        inject: ['DATA_SOURCE'],
    },{
        provide: 'USER_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
        inject: ['DATA_SOURCE'],
    }
]