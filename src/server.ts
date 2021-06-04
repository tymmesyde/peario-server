import fs from 'fs';
import https from 'https';
import WS from './ws';
import { Room, User, Player, Client } from './models';
import { PORT, PEM_CERT, PEM_KEY, INTERVAL_CLIENT_CHECK, INTERVAL_ROOM_UPDATE } from './config';
import { EventData, Message, MessageEvent } from './models/event';

let ROOMS: Room[] = [];

const server = https.createServer({
    cert: fs.readFileSync(PEM_CERT),
    key: fs.readFileSync(PEM_KEY)
}).listen(PORT);

console.log(`Listening on port ${PORT}`);

const wss = new WS(server, INTERVAL_CLIENT_CHECK);
wss.events.on('room.new', createRoom);
wss.events.on('room.join', joinRoom);
wss.events.on('room.message', messageRoom);
wss.events.on('player.sync', syncPlayer);
wss.events.on('heartbeat', heartbeat);

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

function messageRoom({ client, payload }: MessageEvent) {
    const room = _getClientRoom(client);
    if (!room) return client.sendEvent('error', { type: 'room' });

    if (payload.content) {
        const message = new Message(client, payload.content);
        if ((message.date - client.cooldown) / 1000 < 3) return client.sendEvent('error', { type: 'cooldown' });

        const clients = wss.clients.filter(c => c.room_id === room.id);
        clients.forEach(c => c.sendEvent('message', message));
        client.resetCooldown();
    }
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

function heartbeat({ client }: EventData) {
    client.last_active = new Date().getTime();
}

function _getClientRoom({ room_id }: Client) {
    return ROOMS.find(r => r.id === room_id) || null;
}

setInterval(() => {
    ROOMS = ROOMS.filter(room => {
        room.users = room.users.filter(user => wss.clients.find(client => client.id === user.id));
        return room.users.length;
    });
}, INTERVAL_ROOM_UPDATE);