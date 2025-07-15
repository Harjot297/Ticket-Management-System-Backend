import { accessTokenPayload } from "../../interfaces/tokenPayloads";

declare global {
    namespace Express{
        interface Request{
            user ?: accessTokenPayload;
        }
    }
}