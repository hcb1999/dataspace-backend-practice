import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const databaseProviders = [
    {
        provide: 'DATA_SOURCE',
        // imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => {
            const dataSource = new DataSource({
                type: "postgres",
                host: configService.get<string>('PG_HOST'),
                port: configService.get<number>('PG_PORT'),
                username: configService.get<string>('PG_USERNAME'),
                password: configService.get<string>('PG_PASSWORD'),
                database: configService.get<string>('PG_DATABASE'),
                synchronize: configService.get('PG_SYNC'),
                logging: false,
                entities: [
                    __dirname + '/../**/*.entity{.ts,.js}'
                ],
                migrations: [],
                subscribers: [],
                extra: {
                    timezone: configService.get<string>('PG_TIMEZONE'),
                },
            });

            return dataSource.initialize();
        },
    },
];