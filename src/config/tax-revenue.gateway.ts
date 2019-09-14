import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class TaxRevenueGateway {
  @WebSocketServer() server: Server;

  sendNewTaxRevenue(taxRevenueNumber: string) {
    if (this.server) {
      this.server.clients().emit('newTaxRevenue', { taxRevenueNumber });
    }
  }
}
