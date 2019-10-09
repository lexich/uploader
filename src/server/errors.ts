
export class BaseError extends Error {
    public status = 500;
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, BaseError.prototype);
    }
}
export class NotFound extends BaseError {
    public status = 404;
}

export class HaventAccess extends BaseError {
    public status = 401;
}
