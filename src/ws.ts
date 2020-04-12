import https from 'https';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { Client, User } from './models';
import EventData from './models/event';

class WS {

    private wss: WebSocket.Server;
    public events = new EventEmitter;
    public clients: Client[] = [];

    constructor(server: https.Server) {
        this.wss = new WebSocket.Server({ server });
        this.wss.on('connection', (socket: WebSocket) => {
            const client = new Client(socket);
            client.sendEvent('ready', { user: new User(client) });
            client.onMessage((data: string) => this.handleEvents(client, data));
            this.clients.push(client);
            console.log('New client:', client.id, client.name);
        });
    }

    private handleEvents(client: Client, data: string) {
        const { type, payload } = JSON.parse(data);
        this.events.emit(type, <EventData> { client, payload });
        console.log(client.name, type);
    }

}

export default WS;