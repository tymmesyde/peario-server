class Stream {
    url?: string;
    infoHash?: string;
    fileIdx?: number;

    constructor(stream: any) {
        this.url = stream.url;
        this.infoHash = stream.infoHash;
        this.fileIdx = stream.fileIdx;
    }
};

export default Stream;