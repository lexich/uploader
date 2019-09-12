export class InvalidLoginError extends Error {
    public status = 401;
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidLoginError.prototype)
    }
}
