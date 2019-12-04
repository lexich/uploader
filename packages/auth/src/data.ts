
export interface IUserRepository<TUser extends { id: number }> {
    create(id?: number): TUser;
    toPlainObject(user: TUser): Object;
    findOne(id: number): Promise<TUser>;
    findUser(name: string, password: string): Promise<TUser>;
}

export class InvalidLoginError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidLoginError.prototype);
    }
}
