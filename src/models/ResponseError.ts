export default class ResponseError {
    public name: string;
    public message: string;

    constructor(name: string, message: string) {
        this.name = name || "Unknown error";
        this.message = message || null;
    }

    public toClearedObject() {
        const object: any = {};
        if (this.name) {
            object.name = this.name;
        }
        if (this.message) {
            object.message = this.message;
        }
        return object;
    }
}
