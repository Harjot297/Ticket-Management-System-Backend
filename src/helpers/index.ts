import crypto from 'crypto'

const SECRET = "hola";

export const hashPassword = (salt: String , password: string) => {
    return crypto.createHmac('sha256' , [salt,password].join("/")).update(SECRET).digest('hex');
}

export const randomString = () : string => {
    return crypto.randomBytes(126).toString('base64');
}

