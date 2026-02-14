import  order from '@/types/order'

export interface WorkDay {
    id: string;
    date: string;
    shifts: Shift [];
    totalTime: string;
    orders: order [];
    activeTime: string;
    idleTime: string;
    totalPay: TotalPay;
}

export interface TotalPay {
    gross: number;
    net: number;
    activeHourlyGross: number;
    activeHourlyNet: number;
    overallHourlyGross: number; // includes idleTime
    overallHourlyNet: number; // includes idleTime
}

export interface Shift {
    clockInTime: string; // Readable HH:MM
    clockOutTime: string;
    duration: string;
}