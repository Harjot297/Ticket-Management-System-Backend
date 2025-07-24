export interface createHallBody{
    theatreId: string;
    name: string;
    rows: number;
    seatsPerRow : number;
    format: string;
    regularSeatAmount: number;
    vipSeatAmount: number;
    premiumSeatAmount: number;
}