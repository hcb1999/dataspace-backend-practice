import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ResponseMessage } from '../common/response';
import { ResponseMetadata } from 'src/common/responseMetadata';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { NftProviders } from './nft.provider';
// import { BullModule } from '@nestjs/bull';
import { NftProcessor } from './nft.processor';
import { NftGateway } from './nft.gateway';
import { ClientsModule, Transport} from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    // BullModule.registerQueue({
    //   name: 'transaction',
    // }),
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://avataroad:avataroad@localhost:5672'], // RabbitMQ 서버 URL 확인
          queue: 'transaction_queue', // 큐 이름 확인
          // noAck: false,
          queueOptions: {
            durable: true,
            'x-dead-letter-exchange': 'dlx_exchange1',
            'x-dead-letter-routing-key': 'dlx_routing_key1',
            'x-message-ttl': 10000,
          },
        },
      },
    ]),
    DatabaseModule,
    HttpModule, 
    // JwtModule,
    ],
  controllers: [NftController, NftProcessor], 
  providers: [...NftProviders, NftService, NftGateway, ResponseMessage, ResponseMetadata],  
  exports: [NftService]
})
export class NftModule {}