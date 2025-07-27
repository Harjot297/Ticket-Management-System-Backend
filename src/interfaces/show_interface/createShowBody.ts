export interface createShowBody {
    movieId : string;
    theatreId: string;
    hallId: string;
    showDate: string;
    startTime: string;
    endTime: string;
    language: string;
    format: string;
    pricing: {
        regular: number;
        vip : number;
        premium: number;
    }
}