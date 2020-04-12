import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

class Client {
    public id: String;
    public name: String;
    public room_id: String = '';
    private socket: WebSocket;

    constructor(socket: WebSocket) {
        this.id = uuidv4();
        this.name = `Guest${this.id.substr(0, 4)}`;
        this.socket = socket;
    }

    onMessage(callback: (data: string) => void) {
        this.socket.on('message', callback);
    }

    sendEvent(type: string, payload: object) {
        this.socket.send(JSON.stringify({ type, payload }));
    }
}

export default Client;