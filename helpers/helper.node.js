function parseDurationToSeconds(value) {
	if (typeof value === 'number') return Math.max(0, value);
	if (!value) return 0;

	const parts = value.split(':').map(Number);
	if (parts.some(Number.isNaN)) return 0;

	if (parts.length === 2) {
		const [hh, mm] = parts;
		return hh * 3600 + mm * 60;
	}

	if (parts.length === 3) {
		const [hh, mm, ss] = parts;
		return hh * 3600 + mm * 60 + ss;
	}

	return 0;
}

function secondsToHHMMSS(totalSeconds) {
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

function orderGross(order) {
	if (typeof order?.pay === 'number') return order.pay;
	return Number(order?.pay?.gross ?? 0);
}

function orderNet(order) {
	if (typeof order?.pay === 'number') {
		return Number(order.pay) - Number(order?.miles ?? 0) * 0.67;
	}

	const explicitNet = Number(order?.pay?.net);
	if (Number.isFinite(explicitNet)) return explicitNet;
	return Number(order?.pay?.gross ?? 0) - Number(order?.miles ?? 0) * 0.67;
}

function calculateDayTotals(shifts, orders) {
	const totalShiftSeconds = shifts.reduce(
		(sum, shift) => sum + parseDurationToSeconds(shift.duration),
		0,
	);
	const activeSeconds = orders.reduce(
		(sum, order) => sum + parseDurationToSeconds(order.totalDuration),
		0,
	);
	const idleSeconds = Math.max(totalShiftSeconds - activeSeconds, 0);

	const gross = orders.reduce((sum, order) => sum + orderGross(order), 0);
	const net = orders.reduce((sum, order) => sum + orderNet(order), 0);

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

function parseTimeToMinutes(value) {
	const trimmed = value.trim();

	const m24 = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
	if (m24) return Number(m24[1]) * 60 + Number(m24[2]);

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

function generateId() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

module.exports = {
	generateId,
	parseDurationToSeconds,
	calculateDayTotals,
	parseTimeToMinutes,
};
