class Meta {
    id: String;
    name: String;
    description: String;
    year: Number;
    logo: String;
    poster: String;
    background: String;

    constructor(meta: any) {
        this.id = meta.id;
        this.name = meta.name;
        this.description = meta.description;
        this.year = meta.year;
        this.logo = meta.logo;
        this.poster = meta.poster;
        this.background = meta.background;
    }
};

export default Meta;