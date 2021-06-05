import Client from "./client";

class User {
    id: String;
    name: String;
    room_id: String;

    constructor(client: Client) {
        this.id = client.id;
        this.name = client.name;
        this.room_id = client.room_id;
    }
}

export default User;