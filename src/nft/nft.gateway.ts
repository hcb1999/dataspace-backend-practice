import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class NftGateway {
  @WebSocketServer()
  server: Server;

  // Function to register wallet address and join a room
  @SubscribeMessage('registerWallet')
  handleRegisterWallet(client: Socket, wallet_address: string) {
    // console.log(`Client with wallet address ${wallet_address} joined.`);
    client.join(wallet_address);
  }

  sendTransactionResult(wallet_address: string, result: any) {
    // 특정 지갑 주소에 해당하는 클라이언트에게 전송
    // console.log(`Client with wallet address ${wallet_address} 메시지 보내기.`);
    this.server.to(wallet_address).emit('transactionResult', result);
  }

  sendEventNotification(eventType: string, eventData: any) {
    // 모든 클라이언트에게 이벤트 알림 전송
    this.server.emit(eventType, eventData);
  }
}
