import Client from "./client";

interface EventData {
    client: Client,
    payload: object
};

export default EventData;