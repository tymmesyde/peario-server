import WebSocket from 'ws';

interface Client extends WebSocket {
    id: String,
    token: String,
    name: String,
    room_id: String,
};

export default Client;