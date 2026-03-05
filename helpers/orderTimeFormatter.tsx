import { Shift, TotalPay, WorkDay } from '@/types/workday';
import Order from '@/types/order';

import { secondsToHHMMSS } from './helper';

type OrderTimes = {
	toRestaurant: string;
	atRestaurant: string;
	toCustomer: string;
	returnToHotspot: string;
	totalTravel: string;
	totalWait: string; //at restaurant + returnToHotspot
	totalDuration: string;
	percentages: {
		toRestaurant: number;
		atRestaurant: number;
		toCustomer: number;
		returnToHotspot: number;
		totalTravel: number;
		totalWait: number;
	};
};

export function formatOrderTimes(order: Order): OrderTimes {
	const totalTime =
		order.segments.toRestaurant +
		order.segments.atRestaurant +
		order.segments.toCustomer +
		order.segments.returnToHotspot;

	const travelTime = order.segments.toRestaurant + order.segments.toCustomer;
	const waitTime = order.segments.atRestaurant + order.segments.returnToHotspot;

	const orderTimes: OrderTimes = {
		toRestaurant: secondsToHHMMSS(order.segments.toRestaurant),
		atRestaurant: secondsToHHMMSS(order.segments.atRestaurant),
		toCustomer: secondsToHHMMSS(order.segments.toCustomer),
		returnToHotspot: secondsToHHMMSS(order.segments.returnToHotspot),
		totalTravel: secondsToHHMMSS(travelTime),
		totalWait: secondsToHHMMSS(waitTime),
		totalDuration: secondsToHHMMSS(totalTime),
		percentages: {
			toRestaurant: order.segments.toRestaurant / order.totalDuration,
			atRestaurant: order.segments.atRestaurant / order.totalDuration,
			toCustomer: order.segments.toCustomer / order.totalDuration,
			returnToHotspot: order.segments.returnToHotspot / order.totalDuration,
			totalTravel: travelTime / order.totalDuration,
			totalWait: waitTime / order.totalDuration,
		},
	};

	return orderTimes;
}
