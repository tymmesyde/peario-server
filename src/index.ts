import fs from 'fs';
import https from 'https';
import WS from './ws';
import { PORT, PEM_CERT, PEM_KEY, INTERVAL_CLIENT_CHECK, INTERVAL_ROOM_UPDATE } from './common/config';
import { ClientEvent, ClientNewRoom, CientJoinRoom, ClientMessage, ClientSync } from './shared/events/client';
import { RoomEvent, SyncEvent, MessageEvent, ErrorEvent } from './shared/events/server';
import RoomManager from './room';

const server = https.createServer({
    cert: fs.readFileSync(PEM_CERT),
    key: fs.readFileSync(PEM_KEY)
}).listen(PORT);

console.log(`Listening on port ${PORT}`);

const wss = new WS(server, INTERVAL_CLIENT_CHECK);
const roomManager = new RoomManager();

wss.events.on('room.new', createRoom);
wss.events.on('room.join', joinRoom);
wss.events.on('room.message', messageRoom);
wss.events.on('player.sync', syncPlayer);
wss.events.on('heartbeat', heartbeat);

function createRoom({ client, payload }: ClientNewRoom) {
    const room = roomManager.create(client, payload);
    client.sendEvent(new RoomEvent(room));
}

function joinRoom({ client, payload }: CientJoinRoom) {
    const { id } = payload;

    const room = roomManager.join(client, id);
    if (!room) return client.sendEvent(new ErrorEvent('room'));

    wss.sendToRoomClients(room.id, new SyncEvent(room));
}

function messageRoom({ client, payload }: ClientMessage) {
    const room = roomManager.getClientRoom(client);
    if (!room) return client.sendEvent(new ErrorEvent('room'));

    if (payload.content) {
        const event = new MessageEvent(client, payload.content);
        if ((event.payload.date - client.cooldown) / 1000 < 3) return client.sendEvent(new ErrorEvent('cooldown'));

        wss.sendToRoomClients(room.id, event);
        client.resetCooldown();
    }
}

function syncPlayer({ client, payload: player }: ClientSync) {
    const room = roomManager.getClientRoom(client);
    if (!room) return client.sendEvent(new ErrorEvent('room'));
    
    if (room.owner === client.id) {
        room.player = player;

        const clients = wss.getClientsByRoomId(room.id).filter(c => c.id !== client.id);
        wss.sendToClients(clients, new SyncEvent(room));
    } else {
        client.sendEvent(new SyncEvent(room));
    }
}

function heartbeat({ client }: ClientEvent) {
    client.last_active = new Date().getTime();
}

setInterval(() => {
    roomManager.rooms = roomManager.rooms.filter(room => {
        room.users = room.users.filter(user => wss.clients.find(client => client.id === user.id));
        return room.users.length;
    });
}, INTERVAL_ROOM_UPDATE);