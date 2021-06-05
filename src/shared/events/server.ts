import { Client, User } from "..";
import { Room } from "../room";

type ServerEvent = {
    type: string;
    payload: object;
};

class ReadyEvent implements ServerEvent {
    type = 'ready';
    payload: {
        user: User
    };

    constructor(user: User) {
        this.payload = {
            user
        };
    }
}

class RoomEvent implements ServerEvent {
    type = 'room';
    payload: Room;

    constructor(room: Room) {
        this.payload = room;
    }
}

class SyncEvent extends RoomEvent {
    type = 'sync';
}

class MessageEvent implements ServerEvent {
    type = 'message';
    payload: {
        user: string;
        content: string;
        date: number;
    }

    constructor(sender: Client, content: string) {
        this.payload = {
            user: sender.id,
            content: content.substring(0, 300),
            date: Date.now()
        };
    }
}

class ErrorEvent implements ServerEvent {
    type = 'error';
    payload: {
        type: string
    };

    constructor(type: string) {
        this.payload = {
            type
        };
    }
}

export {
    ServerEvent,
    ReadyEvent,
    RoomEvent,
    SyncEvent,
    MessageEvent,
    ErrorEvent
};