import https from 'https';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { Client, User } from './shared';
import { ServerEvent, ReadyEvent } from './shared/events/server';
import { ClientEvent } from './shared/events/client';

class WS {

    private wss: WebSocket.Server;
    public events = new EventEmitter;
    public clients: Client[] = [];

    constructor(server: https.Server, cleanInterval: number) {
        this.wss = new WebSocket.Server({ server });
        this.wss.on('connection', (socket: WebSocket) => {
            const client = new Client(socket);
            client.sendEvent(new ReadyEvent(new User(client)));
            client.onMessage((data: string) => this.handleEvents(client, data));
            this.clients.push(client);
            console.log('New client:', client.id, client.name);
        });

        // Clean clients when inactive
        setInterval(() => this.clients = this.clients.filter(c => (new Date().getTime() - c.last_active) < cleanInterval), cleanInterval);
    }

    private handleEvents(client: Client, data: string) {
        try {
            const { type, payload } = JSON.parse(data);
            this.events.emit(type, <ClientEvent>{ client, payload });
            console.log(client.name, type);
        } catch(e) {
            console.error('Error while parsing event');
        }
    }

    public getClientsByRoomId(room_id: string) {
        return this.clients.filter(client => client.room_id === room_id);
    }

    public sendToClients(clients: Client[], event: ServerEvent) {
        clients.forEach(c => c.sendEvent(event));
    }

    public sendToRoomClients(room_id: string, event: ServerEvent) {
        const clients = this.getClientsByRoomId(room_id);
        this.sendToClients(clients, event);
    }

}

export default WS;