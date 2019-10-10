export interface IUser {
    id: number;
}

export interface IUserRepository {
    findOne(id: number): Promise<IUser>;
    findUser(name: string, password: string): Promise<IUser>;
}

export class InvalidLoginError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidLoginError.prototype);
    }
}
