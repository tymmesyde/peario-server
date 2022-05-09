import { v4 as uuidv4 } from 'uuid';
import User from "./user";
import Stream from "./stream";
import Player from "./player";
import Meta from "./meta";

interface RoomOptions {
    meta: Meta;
    stream: Stream;
}

class Room {
    public id: string;
    public stream: Stream;
    public meta: Meta;
    public users: User[];
    public player: Player;
    public owner?: string;

    constructor(options: RoomOptions) {
        this.id = uuidv4();
        this.stream = new Stream(options.stream);
        this.meta = new Meta(options.meta);
        this.player = new Player();
        this.users = [];
    }
};

export {
    Room,
    RoomOptions
};