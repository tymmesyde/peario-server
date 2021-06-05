class Player {
    paused: boolean;
    buffering: boolean;
    time: number;

    constructor() {
        this.paused = true;
        this.buffering = true;
        this.time = 0;
    }
};

export default Player;