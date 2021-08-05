import { Client, User, Room, RoomOptions } from "./shared";

class RoomManager {

    public rooms: Room[];

    constructor() {
        this.rooms = [];
    }

    public getClientRoom(client: Client) {
        return this.rooms.find(({ id }) => id === client.room_id) || null;
    }

    public create(client: Client, options: RoomOptions) {
        const room = new Room(options);
        room.owner = client.id;
        this.rooms.push(room);
        return room;
    }

    public join(client: Client, room_id: string) {
        const room = this.rooms.find(({ id }) => id === room_id);
        if (!room) return null;

        client.room_id = room.id;
        room.users.push(new User(client));
        return room;
    }

    public update(room_id: string, user: User) {
        const room = this.rooms.find(({ id }) => id === room_id);
        if (!room) return null;

        room.users = room.users.map(room_user => {
            if (room_user.id === user.id) room_user = user;
            return room_user;
        });

        return room;
    }

}

export default RoomManager;