import fs from 'fs';
import https from 'https';
import WS from './ws';
import { Room, User, EventData, Player } from './models';
import { PORT, PEM_CERT, PEM_KEY } from './config';

const ROOMS: Room[] = [];

const server = https.createServer({
    cert: fs.readFileSync(PEM_CERT),
    key: fs.readFileSync(PEM_KEY)
}).listen(PORT);

console.log(`Listening on port ${PORT}`);

const wss = new WS(server);
wss.events.on('room.new', createRoom);
wss.events.on('room.join', joinRoom);
wss.events.on('player.sync', syncPlayer);

function createRoom({ client, payload }: EventData) {
    const room = new Room(payload as Room);
    room.owner = client.id;
    room.player = new Player();
    room.users = [];
    ROOMS.push(room);
    client.sendEvent('room', room);
}

function joinRoom({ client, payload }: EventData) {
    const { id } = payload as Room;
    const room = ROOMS.find(r => r.id === id);

    if (room) {
        client.room_id = room.id;
        const clients = wss.clients.filter(c => c.room_id === room.id);;
        room.users = clients.map(c => new User(c)); 
        clients.forEach(c => c.sendEvent('sync', room));
    } else client.sendEvent('error', { type: 'room' });
}

function syncPlayer({ client, payload }: EventData) {
    const player = payload as Player;
    const room = ROOMS.find(r => r.id === client.room_id);

    if (room) {
        if (room.owner === client.id) {
            room.player = player;
            const clients = wss.clients.filter(c => c.room_id === room.id && c.id !== client.id);
            clients.forEach(c => c.sendEvent('sync', room));
        } else {
            client.sendEvent('sync', room);
        }
    } else client.sendEvent('error', { type: 'room' });
}