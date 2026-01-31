export interface TimeClock {
    date: string;
    shifts: {
            clockInTime: string;
            clockOffTime: string;
            duration: string;
        } [];
    totalTime: string;
}