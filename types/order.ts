export interface Order {
	id: string;
	date: string;
	service: string;
	restaurant: string;
	miles: number;
	timestamps: Timestamps;
	segments: Segments;
	totalDuration: number;
	pay: Pay;
}

export interface Segments {
	// tracks time elapsed
	toRestaurant: number;
	atRestaurant: number;
	toCustomer: number;
	returnToHotspot: number;
}

export interface Timestamps {
	// tracks time at each point
	startTime: string;
	restArrivalTime: string;
	restDepartureTime: string;
	deliveryTime: string;
	endDeadheadTime: string; // time a new offer came in
	// time returned to hotspot
	// time begin idle clock
}

export interface Pay {
	gross: number;
	net: number;
	grossHourly: number;
	netHourly: number;
}
