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

	const inMinutes = parseTimeToMinutes(shift.clockInTime);
	const nowMinutes = now.getHours() * 60 + now.getMinutes();

	// Handle crossing midnight
	const elapsedMinutes =
		nowMinutes >= inMinutes
			? nowMinutes - inMinutes
			: nowMinutes + 24 * 60 - inMinutes;

	return elapsedMinutes;
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
	const totalActiveTime = workDay.shifts.reduce(
		(sum, shift) => sum + parseDurationToSeconds(shift.duration),
		0,
	);
	const totalIdleTime = Math.max(totalTime - totalActiveTime);

	const activeHourlyGross =
		totalActiveTime > 0 ? totalGross / totalActiveTime : 0;

	const activeHourlyNet = totalActiveTime > 0 ? totalNet / totalActiveTime : 0;

	const overallHourlyGross = totalTime > 0 ? totalGross / totalTime : 0;
	const overallHourlyNet = totalTime > 0 ? totalNet / totalTime : 0;

	const calculatedMetrics: DashboardMetrics = {
		totalGross,
		totalActiveHourlyGross: activeHourlyGross,
		totalOverallHourlyGross: overallHourlyGross,
		totalNet,
		totalActiveHourlyNet: activeHourlyNet,
		totalOverallHourlyNet: overallHourlyNet,
		totalMiles,
		totalActiveTime: secondsToHHMMSS(totalActiveTime),
		totalIdleTime: secondsToHHMMSS(totalIdleTime),
		totalTime: calculateWorkDayElapsedHHMMSS(workDay.shifts),
	};

	// CACLULATE METRICS

	// Check if on active shift.
	// total time should include completed shifts for the day, plus the current duration of the active shift

	return calculatedMetrics;
}
