export interface ActiveOrder {
    date: string;
    service: 'GrubHub' | 'DoorDash' | 'UberEats';
    restaurant: string;
    pay: number;
    miles: number;
    startTime: string; // HH:MM
    restArrivalTime: string; 
    restDepartureTime: string;
    deliveryTime: string;
    segments: {
        toRestaurant: number; // Duration in minutes
        atRestaurant: number;
        toCustomer: number;
        returnToHotspot: number;
    }
}