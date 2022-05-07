import Client from "./client";

class User {
    id: string;
    name: string;
    room_id: string;

    constructor(client: Client) {
        this.id = client.id;
        this.name = client.name;
        this.room_id = client.room_id;
    }
}

export default User;