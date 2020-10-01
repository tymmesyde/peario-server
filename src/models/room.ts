import { v4 as uuidv4 } from 'uuid';
import User from "./user";
import Stream from "./stream";
import Player from "./player";
import Meta from "./meta";

class Room {
    id: String;
    stream: Stream;
    meta: Meta;
    owner: String;
    users: User[];
    player: Player;

    constructor(room: Room) {
        this.id = uuidv4();
        this.stream = room.stream as Stream;
        this.meta = new Meta(room.meta);
        this.owner = room.owner;
        this.users = room.users;
        this.player = room.player;
    }
};

export default Room;