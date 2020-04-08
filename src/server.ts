import WS from './ws';
import { Room, User, Client, EventData, Player } from './models';

const ROOMS: Room[] = [];

const wss = new WS(8181);
wss.events.on('room.new', createRoom);
wss.events.on('room.join', joinRoom);
wss.events.on('player.sync', syncPlayer);

function createRoom({ client, payload }: EventData) {
    const room = new Room(payload as Room);
    room.owner = client.id;
    room.player = { paused: true, buffering: true, time: 0 };
    room.users = [];
    ROOMS.push(room);
    sendEvent(client, 'room', room);
}

function joinRoom({ client, payload }: EventData) {
    const { id } = payload as Room;
    const room = ROOMS.find(r => r.id === id);

    if (room) {
        client.room_id = room.id;
        const clients = wss.clients.filter(c => c.room_id === room.id);;
        room.users = clients.map(c => new User(c)); 
        clients.forEach(c => sendEvent(c, 'sync', room));
    }
}

function syncPlayer({ client, payload }: EventData) {
    const player = payload as Player;
    const room = ROOMS.find(r => r.id === client.room_id);

    if (room) {
        if (room.owner === client.id) {
            room.player = player;
            const clients = wss.clients.filter(c => c.room_id === room.id && c.id !== client.id);
            clients.forEach(c => sendEvent(c, 'sync', room));
        } else {
            sendEvent(client, 'sync', room);
        }
    }
}

function sendEvent(client: Client, type: string, payload: object) {
    client.send(JSON.stringify({ type, payload }));
}