import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { ServerEvent } from './events/server';

class Client {
    public id: string;
    public name: string;
    public room_id: string = '';
    public last_active: number;
    public cooldown: number;

    private socket: WebSocket;

    constructor(socket: WebSocket) {
        this.id = uuidv4();
        this.name = `Guest${this.id.substr(0, 4)}`;
        this.last_active = new Date().getTime();
        this.socket = socket;
        this.cooldown = Date.now();
    }

    onMessage(callback: (data: string) => void) {
        this.socket.on('message', callback);
    }

    sendEvent({ type, payload }: ServerEvent) {
        this.socket.send(JSON.stringify({ type, payload }));
    }

    resetCooldown() {
        this.cooldown = Date.now();
    }
}

export default Client;