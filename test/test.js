process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const { PORT } = process.env;
const assert = require('assert');
const WebSocket = require('ws');
const waitOn = require('wait-on');

const serverUrl = `wss://localhost:${PORT}`;

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

function createClient(catchReady = true) {
    return new Promise(resolve => {
        const client = new WebSocket(serverUrl);
        client.sendEvent = (type, payload) => {
            try {
                client.send(JSON.stringify({ type, payload }));
            } catch (e) {
                console.error(e);
            }
        };

        client.on('message', (event) => {
            try {
                const { type, payload } = JSON.parse(event);
                client.emit('event', type, payload);
            } catch (e) {
                console.error(e);
            }
        });

        if (catchReady) client.once('event', (type, payload) => {
            if (type === 'ready') {
                client.id = payload.user.id;
                resolve(client);
            }
        });
        else client.once('open', () => resolve(client));

        client.createRoom = () => {
            return new Promise((resolve) => {
                client.once('event', (type, payload) => {
                    if (type === 'room')
                        resolve(payload);
                });

                client.sendEvent('room.new', {
                    meta,
                    stream
                }); 
            });
        };

        client.joinRoom = (id) => {
            return new Promise((resolve) => {
                client.once('event', (type, payload) => {
                    if (type === 'sync')
                        resolve(payload);
                });

                client.sendEvent('room.join', {
                    id
                });
            });
        };
    });
}

describe('Client', function() {
    this.timeout(5000);

    function testRoomObject(payload) {
        assert.deepStrictEqual(payload.stream, stream);
        assert.deepStrictEqual(payload.meta, meta);
        assert.deepStrictEqual(payload.player, player);
        assert.strictEqual(Array.isArray(payload.users), true);
    }

    before(function() {
        return waitOn({
            resources: [`https://localhost:${PORT}`]
        });
    });

    it('should return a ready event', (done) => {
        createClient(false).then((client) => {
            client.once('event', (type, payload) => {
                assert.strictEqual(type, 'ready');
                assert.strictEqual(typeof payload, 'object');
                assert.strictEqual(typeof payload.user, 'object');
                assert.strictEqual(typeof payload.user.id, 'string');
                assert.strictEqual(typeof payload.user.name, 'string');
                assert.strictEqual(typeof payload.user.room_id, 'string');

                client.close();
                done();
            });
        });
    });

    it('should update username', (done) => {
        createClient().then((client) => {
            const username = 'ohoh';

            client.once('event', (type, payload) => {
                assert.strictEqual(type, 'user');
                assert.strictEqual(payload.user.name, username);

                client.close();
                done();
            });

            client.sendEvent('user.update', {
                username
            });
        });
    });
    
    it('should create a room and return a room event', (done) => {
        createClient().then((client) => {
            client.createRoom().then((roomPayload) => {
                testRoomObject(roomPayload);
                assert.strictEqual(typeof roomPayload.id, 'string');

                client.close();
                done();
            });
        });
    });

    it('should join a room that does not exist and return an error event', (done) => {
        createClient().then((client) => {
            client.once('event', (type, payload) => {
                assert.strictEqual(type, 'error');
                assert.strictEqual(payload.type, 'room');

                client.close();
                done();
            });

            client.sendEvent('room.join', {
                id: 'ahah'
            });
        });
    });

    it('should join a room and return a sync event', (done) => {
        createClient().then((client) => {
            client.createRoom().then(({ id, owner }) => {
                client.once('event', (type, payload) => {
                    assert.strictEqual(type, 'sync');
                    testRoomObject(payload);
                    assert.strictEqual(payload.id, id);
                    assert.strictEqual(payload.owner, owner);
                    assert.strictEqual(payload.users[0].id, owner);
                    assert.strictEqual(payload.users[0].room_id, id);

                    client.close();
                    done();
                });

                client.sendEvent('room.join', {
                    id
                });
            });
        });
    });

    it('should send a message without joining a room and return a room error event', (done) => {
        createClient().then((client) => {
            client.once('event', (type, payload) => {
                assert.strictEqual(type, 'error');
                assert.strictEqual(payload.type, 'room');

                client.close();
                done();
            });

            client.sendEvent('room.message', {
                content: '.'
            });
        });
    });

    it('should send multiple messages and return a cooldown error event', (done) => {
         createClient().then((client) => {
            client.createRoom().then(({ id }) => {
                client.joinRoom(id).then(() => {
                    client.once('event', (type, payload) => {
                        assert.strictEqual(type, 'error');
                        assert.strictEqual(payload.type, 'cooldown');

                        client.close();
                        done();
                    });

                    client.sendEvent('room.message', {
                        content: '.'
                    });

                    client.sendEvent('room.message', {
                        content: '.'
                    });
                });
            });
        });
    });

    it('should send a message and return a message event', (done) => {
        createClient().then((client) => {
            client.createRoom().then(({ id }) => {
                client.joinRoom(id).then(() => {
                    let content = 'hello';

                    client.once('event', (type, payload) => {
                        assert.strictEqual(type, 'message');
                        assert.strictEqual(payload.user, client.id);
                        assert.strictEqual(payload.content, content);

                        client.close();
                        done();
                    });

                    setTimeout(() => {
                        client.sendEvent('room.message', {
                            content
                        });
                    }, 3000);
                });
            });
        });
    });

    it('should let other clients to join room', (done) => {
        createClient().then((client) => {
            createClient().then((otherClient) => {
                client.createRoom().then(({ id, owner }) => {
                    client.joinRoom(id).then(() => {
                        otherClient.joinRoom(id).then((syncPayload) => {
                            testRoomObject(syncPayload);
                            assert.strictEqual(syncPayload.id, id);
                            assert.strictEqual(syncPayload.owner, owner);
                            assert.strictEqual(syncPayload.users.length, 2);

                            client.close();
                            otherClient.close();
                            done();
                        });
                    });
                });
            });
        });
    });

    it('should try to update room ownership and return user error', (done) => {
        createClient().then((client) => {
            client.createRoom().then(({ id }) => {
                client.joinRoom(id).then(() => {
                    client.once('event', (type, payload) => {
                        assert.strictEqual(type, 'error');
                        assert.strictEqual(payload.type, 'user');

                        client.close();
                        done();
                    });

                    client.sendEvent('room.updateOwnership', {
                        userId: 'gigou'
                    });
                });
            });
        });
    });

    it('should update room ownership', (done) => {
        createClient().then((client) => {
            createClient().then((otherClient) => {
                client.createRoom().then(({ id }) => {
                    client.joinRoom(id).then(() => {
                        otherClient.joinRoom(id).then(() => {
                            client.once('event', (type, payload) => {
                                assert.strictEqual(type, 'sync');
                                assert.strictEqual(payload.owner, otherClient.id);

                                client.close();
                                otherClient.close();
                                done();
                            });

                            client.sendEvent('room.updateOwnership', {
                                userId: otherClient.id
                            });
                        });
                    });
                });
            });
        });
    });

    it('should sync player and return a player sync event to other clients', (done) => {
        const playerUpdate = {
            paused: false,
            buffering: false,
            time: 100
        };

        createClient().then((client) => {
            createClient().then((otherClient) => {
                client.createRoom().then(({ id }) => {
                    client.joinRoom(id).then(() => {
                        otherClient.joinRoom(id).then(() => {
                            otherClient.once('event', (type, payload) => {
                                assert.strictEqual(type, 'sync');
                                assert.deepStrictEqual(payload.player, playerUpdate);

                                client.close();
                                otherClient.close();
                                done();
                            });

                            client.sendEvent('player.sync', playerUpdate);
                        });
                    });
                });
            });
        });
    });

});