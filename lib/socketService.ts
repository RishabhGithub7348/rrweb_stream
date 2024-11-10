// app/lib/socketService.ts
import { Socket, io } from 'socket.io-client';

class SocketService {
  private static instance: Socket | null = null;

  public static getInstance(): Socket {
    if (!this.instance) {
      this.instance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
    }
    return this.instance;
  }
}

export default SocketService;