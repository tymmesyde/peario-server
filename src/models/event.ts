import Client from "./client";

interface EventData {
    client: Client,
    payload: object
};

interface ClientEvent {
    client: Client
};

interface MessageEventPayload {
    content: string;
}

interface MessageEvent extends ClientEvent {
    payload: MessageEventPayload
}

class Message {
    user: string;
    content: string;
    date: number;

    constructor(sender: Client, content: string) {
        this.user = sender.id;
        this.content = content.substring(0, 300);
        this.date = Date.now();
    }
}

export {
    EventData,
    MessageEvent,
    Message
};