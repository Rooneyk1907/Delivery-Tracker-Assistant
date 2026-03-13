import type { DashboardMetrics } from '@/types/dashboardmetrics';
import type { WorkDay, Shift } from '@/types/workday';
import type { Order } from '@/types/order';
import {
	parseTimeToMinutes,
	secondsToHHMMSS,
	parseDurationToSeconds,
} from '@/helpers/helper';

import MILEAGE_DEDUCTION from '@/constants/Values';

function getShiftElapsedSeconds(shift: Shift, now: Date = new Date()): number {
	// Closed shift: trust stored duration if valid
	if (shift.clockOutTime) {
		return Number.isFinite(shift.duration) && shift.duration > 0
			? shift.duration
			: 0;
	}

	// Open shift: compute elapsed from clockIn -> now
	if (!shift.clockInTime) return 0;

	const inSeconds = parseTimeToMinutes(shift.clockInTime) * 60;
	const nowSeconds =
		now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

	// Handle crossing midnight
	const elapsedSeconds =
		nowSeconds >= inSeconds
			? nowSeconds - inSeconds
			: nowSeconds + 24 * 3600 - inSeconds;

	return elapsedSeconds;
}

export function calculateWorkDayElapsedSeconds(
	shifts: Shift[],
	now: Date = new Date(),
): number {
	return shifts.reduce(
		(sum, shift) => sum + getShiftElapsedSeconds(shift, now),
		0,
	);
}

export function calculateWorkDayElapsedHHMMSS(
	shifts: Shift[],
	now: Date = new Date(),
): string {
	return secondsToHHMMSS(calculateWorkDayElapsedSeconds(shifts, now));
}

export function calculateDashboardMetrics(workDay: WorkDay): DashboardMetrics {
	// Initialize blank metrics to return

	function orderGross(order: Order): number {
		if (typeof order?.pay === 'number') return order.pay;
		return Number(order?.pay?.gross ?? 0);
	}

	function orderNet(order: Order): number {
		if (typeof order?.pay === 'number') {
			return Number(order.pay) - Number(order?.miles ?? 0) * MILEAGE_DEDUCTION;
		}

		const explicitNet = Number(order?.pay?.net);
		if (Number.isFinite(explicitNet)) return explicitNet;

		return (
			Number(order?.pay?.gross ?? 0) -
			Number(order?.miles ?? 0) * MILEAGE_DEDUCTION
		);
	}

	const totalGross = workDay.orders.reduce(
		(sum, order) => sum + orderGross(order),
		0,
	);

	const totalNet = workDay.orders.reduce(
		(sum, order) => sum + orderNet(order),
		0,
	);

	const totalMiles = workDay.orders.reduce(
		(sum, order) => sum + order.miles,
		0,
	);

	const totalTime = calculateWorkDayElapsedSeconds(workDay.shifts);
	console.log(totalTime);
	const totalActiveTime = workDay.orders.reduce(
		(sum, order) => sum + parseDurationToSeconds(order.totalDuration),
		0,
	);
	const totalIdleTime = Math.max(totalTime - totalActiveTime, 0);

	const totalActiveHours = totalActiveTime / 3600;
	const totalHours = totalTime / 3600;

	const calculatedMetrics: DashboardMetrics = {
		totalGross,
		totalNet,
		totalMiles,
		totalActiveTime: secondsToHHMMSS(totalActiveTime),
		totalIdleTime: secondsToHHMMSS(totalIdleTime),
		totalTime: secondsToHHMMSS(totalTime),
		totalActiveHourlyGross:
			totalActiveHours > 0 ? totalGross / totalActiveHours : 0,
		totalActiveHourlyNet:
			totalActiveHours > 0 ? totalNet / totalActiveHours : 0,
		totalOverallHourlyGross: totalHours > 0 ? totalGross / totalHours : 0,
		totalOverallHourlyNet: totalHours > 0 ? totalNet / totalHours : 0,
	};

	return calculatedMetrics;
}
