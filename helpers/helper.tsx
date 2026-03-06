import { Shift, TotalPay, WorkDay } from '@/types/workday';
import ActiveOrder from '@/types/order';
import Order from '@/types/order';
import { DashboardMetrics } from '@/types/dashboardmetrics';

import { MILEAGE_DEDUCTION } from '@/constants/Values';

export function generateId() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parseDurationToSeconds(
	value: string | number | undefined,
): number {
	if (typeof value === 'number') return Math.max(0, value);
	if (!value) return 0;

	// Split string of HH:MM:SS or MM:SS at ':'
	const parts = value.split(':').map(Number);
	if (parts.some(Number.isNaN)) return 0;

	// If only 2 parts, assumes string was HH:MM
	if (parts.length === 2) {
		const [hh, mm] = parts;
		return hh * 3600 + mm * 60;
	}

	// If string is 3 parts, assumes HH:MM:SS
	if (parts.length === 3) {
		const [hh, mm, ss] = parts;
		return hh * 3600 + mm * 60 + ss;
	}

	return 0;
}

export function formatTimeHHMM(d: Date) {
	return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function secondsBetween(msStart: number, msEnd: number) {
	return Math.round((msEnd - msStart) / 1000);
}

export function formatElapsed(ms: number) {
	const totalSec = Math.floor(ms / 1000);
	const hh = Math.floor(totalSec / 3600)
		.toString()
		.padStart(2, '0');
	const mm = Math.floor((totalSec % 3600) / 60)
		.toString()
		.padStart(2, '0');
	const ss = (totalSec % 60).toString().padStart(2, '0');
	return `${hh}:${mm}:${ss}`;
}

export function secondsToHHMMSS(totalSeconds: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds));

	const hh = Math.floor(seconds / 3600)
		.toString()
		.padStart(2, '0');
	const mm = Math.floor((seconds % 3600) / 60)
		.toString()
		.padStart(2, '0');
	const ss = Math.floor(seconds % 60)
		.toString()
		.padStart(2, '0');

	return `${hh}:${mm}:${ss}`;
}

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

export function calculateDayTotals(
	shifts: Shift[],
	orders: Order[],
): {
	totalTime: string;
	activeTime: string;
	idleTime: string;
	totalPay: TotalPay;
} {
	const totalShiftSeconds = shifts.reduce(
		(sum, s) => sum + parseDurationToSeconds(s.duration),
		0,
	);
	const activeSeconds = orders.reduce(
		(sum, o) => sum + parseDurationToSeconds(o.totalDuration),
		0,
	);
	const idleSeconds = Math.max(totalShiftSeconds - activeSeconds, 0);

	const gross = orders.reduce((sum, o) => sum + orderGross(o), 0);
	const net = orders.reduce((sum, o) => sum + orderNet(o), 0);

	const activeHours = activeSeconds / 3600;
	const overallHours = totalShiftSeconds / 3600;

	return {
		totalTime: secondsToHHMMSS(totalShiftSeconds),
		activeTime: secondsToHHMMSS(activeSeconds),
		idleTime: secondsToHHMMSS(idleSeconds),
		totalPay: {
			gross,
			net,
			activeHourlyGross: activeHours > 0 ? gross / activeHours : 0,
			activeHourlyNet: activeHours > 0 ? net / activeHours : 0,
			overallHourlyGross: overallHours > 0 ? gross / overallHours : 0,
			overallHourlyNet: overallHours > 0 ? net / overallHours : 0,
		},
	};
}

export function parseTimeToMinutes(value: string): number {
	const trimmed = value.trim();

	// 24h: HH:MM
	const m24 = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
	if (m24) return Number(m24[1]) * 60 + Number(m24[2]);

	// 12h: HH:MM AM/PM
	const m12 = trimmed.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
	if (m12) {
		let hour = Number(m12[1]);
		const minute = Number(m12[2]);
		const ampm = m12[3].toUpperCase();
		if (hour === 12) hour = 0;
		if (ampm === 'PM') hour += 12;
		return hour * 60 + minute;
	}

	throw new Error(`Invalid time: ${value}`);
}

export function calculateShiftDuration(
	clockInTime: string,
	clockOutTime: string,
): string {
	const clockInMinutes = parseTimeToMinutes(clockInTime);
	let clockOutMinutes = parseTimeToMinutes(clockOutTime);

	if (clockOutMinutes < clockInMinutes) clockOutMinutes += 24 * 60; // accounts for overnight shifts

	const totalMinutes = clockOutMinutes - clockInMinutes;

	const hh = Math.floor(totalMinutes / 60);
	const mm = totalMinutes % 60;

	return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function calculateDashboardMetrics(
	workDays: WorkDay[],
): DashboardMetrics {
	let totalGross = 0;
	let totalNet = 0;

	let totalMiles = 0;

	let totalActiveTime = 0;
	let totalIdleTime = 0;
	let totalTime = 0;

	workDays.forEach((day) => {
		totalGross += day.totalPay.gross;
		totalNet += day.totalPay.net;

		day.orders.forEach((order) => {
			totalMiles += order.miles;
			totalActiveTime += order.totalDuration; // total active seconds
		});

		totalIdleTime += parseDurationToSeconds(day.idleTime); // total idle seconds
		totalTime += parseDurationToSeconds(day.totalTime); // total seconds
	});

	const totalActiveHours = totalActiveTime / 3600;
	const totalHours = totalTime / 3600;

	const dashboardMetrics: DashboardMetrics = {
		totalGross,
		totalNet,
		totalMiles,
		totalActiveTime: secondsToHHMMSS(totalActiveTime),
		totalIdleTime: secondsToHHMMSS(totalIdleTime),
		totalTime: secondsToHHMMSS(totalTime),
		totalActiveHourlyGross: totalGross / totalActiveHours,
		totalActiveHourlyNet: totalNet / totalActiveHours,
		totalOverallHourlyGross: totalGross / totalHours,
		totalOverallHourlyNet: totalNet / totalHours,
	};

	return dashboardMetrics;
}
