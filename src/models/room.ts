import { v4 as uuidv4 } from 'uuid';
import User from "./user";
import Player from "./player";
import Meta from "./meta";

class Room {
    id: String;
    infoHash: String;
    meta: Meta;
    owner: String;
    users: User[];
    player: Player;

    constructor(room: Room) {
        this.id = uuidv4();
        this.infoHash = room.infoHash;
        this.meta = new Meta(room.meta);
        this.owner = room.owner;
        this.users = room.users;
        this.player = room.player;
    }
};

export default Room;