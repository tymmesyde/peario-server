import https from 'https';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Client } from './models';
import EventData from './models/event';

class WS {

    private wss: WebSocket.Server;
    public events = new EventEmitter;

    constructor(server: https.Server) {
        this.wss = new WebSocket.Server({ server });
        this.wss.on('connection', (client: Client) => {
            client.id = uuidv4();
            client.name = `Guest${client.id.substr(0, 4)}`;
            client.on('message', (data: string) => this.handleEvents(client, data));
            console.log('New client:', client.id, client.name);
        });
    }

    private handleEvents(client: Client, data: string) {
        const { type, payload } = JSON.parse(data);
        this.events.emit(type, <EventData> { client, payload });
        console.log(client.name, type);
    }

    get clients(): Client[] {
        return <Client[]> Array.from(this.wss.clients);
    }

}

export default WS;