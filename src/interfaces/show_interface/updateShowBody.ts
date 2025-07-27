export interface updateShowBody{
    startTime?: string;
    endTime?: string;
    language?: "english" | "hindi" | "tamil" | "telugu";
    format?: "2D" | "3D" | "IMAX";
    pricing?: {
        regular?: number;
        premium?: number;
        vip?: number;
    };
}