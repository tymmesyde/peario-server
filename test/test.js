process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const { PORT } = process.env;
const assert = require('assert');
const WebSocket = require('ws');
const waitOn = require('wait-on');

const serverUrl = `wss://localhost:${PORT}`;

function createClient(catchReady = false) {
    return new Promise(resolve => {
        const client = new WebSocket(serverUrl);
        client.sendEvent = (type, payload) => client.send(JSON.stringify({ type, payload }));
        client.on('message', event => {
            const { type, payload } = JSON.parse(event);
            client.emit('event', { type, payload });
        });

        if (catchReady) client.once('event', ({ type }) => type === 'ready' && resolve(client));
        else client.once('open', () => resolve(client));
    });
}

describe('Client', function() {
    this.timeout(5000);

    let client;
    let otherClient;

    let ownerId;
    let roomId;
    const meta = {
        name: 'Mirabelle'
    };
    const stream = {
        infoHash: '8ca6f333316aba4a769fdb8c2d5824eb9bb92763'
    };
    const player = {
        paused: true,
        buffering: true,
        time: 0
    };

    function testRoomObject(payload) {
        assert.deepStrictEqual(payload.stream, stream);
        assert.deepStrictEqual(payload.meta, meta);
        assert.deepStrictEqual(payload.player, player);
        assert.strictEqual(payload.owner, ownerId);
        assert.strictEqual(Array.isArray(payload.users), true);
    }

    before(function() {
        return waitOn({
            resources: [`https://localhost:${PORT}`]
        });
    })

    after(function(done) {
        client.once('close', () => {
            otherClient.once('close', () => done());
            otherClient.close();
        });
        client.close();
    });

    it('should return a ready event', async function() {
        client = await createClient();

        client.once('event', ({ type, payload }) => {
            assert.strictEqual(type, 'ready');
            assert.strictEqual(typeof payload, 'object');
            assert.strictEqual(typeof payload.user, 'object');
            assert.strictEqual(typeof payload.user.id, 'string');
            assert.strictEqual(typeof payload.user.name, 'string');
            assert.strictEqual(typeof payload.user.room_id, 'string');

            ownerId = payload.user.id;
            return Promise.resolve();
        });
    });

    it('should join a room that does not exist and return an error event', function(done) {
        client.once('event', ({ type, payload }) => {
            assert.strictEqual(type, 'error');
            assert.strictEqual(payload.type, 'room');

            done();
        });

        client.sendEvent('room.join', {
            id: 'ahah'
        });
    });
    
    it('should create a room and return a room event', function(done) {
        client.once('event', ({ type, payload }) => {
            assert.strictEqual(type, 'room');
            testRoomObject(payload);
            assert.strictEqual(typeof payload.id, 'string');

            roomId = payload.id;
            done();
        });

        client.sendEvent('room.new', {
            meta,
            stream
        });
    });

    it('should send a message without joining a room and return an error event', function(done) {
        client.once('event', ({ type, payload }) => {
            assert.strictEqual(type, 'error');
            assert.strictEqual(payload.type, 'room');

            done();
        });

        client.sendEvent('room.message', {
            content: '.'
        });
    });

    it('should join a room and return a sync event', function(done) {
        client.once('event', ({ type, payload }) => {
            assert.strictEqual(type, 'sync');
            testRoomObject(payload);
            assert.strictEqual(payload.id, roomId);
            assert.strictEqual(payload.owner, ownerId);
            assert.strictEqual(payload.users[0].id, ownerId);
            assert.strictEqual(payload.users[0].room_id, roomId);

            done();
        });

        client.sendEvent('room.join', {
            id: roomId
        });
    });

    it('should send a message and return an error event', function(done) {
        client.once('event', ({ type, payload }) => {
            assert.strictEqual(type, 'error');
            assert.strictEqual(payload.type, 'cooldown');

            done();
        });

        client.sendEvent('room.message', {
            content: '.'
        });
    });

    it('should send a message and return a message event', function(done) {
        let content = 'hello';

        client.once('event', ({ type, payload }) => {
            assert.strictEqual(type, 'message');
            assert.strictEqual(payload.user, ownerId);
            assert.strictEqual(payload.content, content);

            done();
        });

        setTimeout(() => {
            client.sendEvent('room.message', {
                content
            });
        }, 3000);
    });

    it('should let other cients to join room', async function() {
        otherClient = await createClient(true);

        otherClient.once('event', ({ type, payload }) => {
            assert.strictEqual(type, 'sync');
            testRoomObject(payload);
            assert.strictEqual(payload.id, roomId);
            assert.strictEqual(payload.owner, ownerId);
            assert.strictEqual(payload.users.length, 2);

            return Promise.resolve();
        });

        otherClient.sendEvent('room.join', {
            id: roomId
        });
    });

    it('should sync and return a sync event to other clients', function(done) {
        const playerUpdate = {
            paused: false,
            buffering: false,
            time: 100
        };

        otherClient.once('event', ({ type, payload }) => {
            assert.strictEqual(type, 'sync');
            assert.deepStrictEqual(payload.player, playerUpdate);

            done();
        });

        client.sendEvent('player.sync', playerUpdate);
    });

});