import {
	parseTimeToMinutes,
	calculateDayTotals,
	parseDurationToSeconds,
	generateId,
} from './helper.node';

function calculateTimeAfterElapsed(startTime: string, elapsedTime: number) {
	const startMinutes = parseTimeToMinutes(startTime);
	const elapsedMinutes = Math.floor(elapsedTime / 60);
	const totalMinutesInDay = 24 * 60;

	const normalizedMinutes =
		(((startMinutes + elapsedMinutes) % totalMinutesInDay) +
			totalMinutesInDay) %
		totalMinutesInDay;

	const hh = Math.floor(normalizedMinutes / 60)
		.toString()
		.padStart(2, '0');
	const mm = (normalizedMinutes % 60).toString().padStart(2, '0');

	return `${hh}:${mm}`;
}

function getRandomDateInRange(startDate: string, endDate: string): string {
	const start = new Date(`${startDate}T00:00:00Z`).getTime();
	const end = new Date(`${endDate}T00:00:00Z`).getTime();

	if (Number.isNaN(start) || Number.isNaN(end)) {
		throw new Error('Invalid date. use YYYY-MM-DD');
	}

	if (end < start) {
		throw new Error('endDate must be >= startDate');
	}

	const randomMs = start + Math.floor(Math.random() * (end - start + 1));
	return new Date(randomMs).toISOString().slice(0, 10);
}

function createSampleShifts(numberofShifts: number) {
	const shifts: Array<{
		clockInTime: string;
		clockOutTime: string;
		duration: number;
	}> = [];
	const onClockDurations: number[] = [];
	const offClockDurations: number[] = [];

	for (let shift = 0; shift <= numberofShifts; shift++) {
		const onClockDuration = Math.floor(Math.random() * 14400);
		const offClockDuration = Math.floor(Math.random() * 3600);

		onClockDurations.push(onClockDuration);
		offClockDurations.push(offClockDuration);
	}

	const randomStartHour = Math.floor(Math.random() * 23);
	const randomStartMinute = Math.floor(Math.random() * 59);
	const dayStartTime = `${String(randomStartHour).padStart(2, '0')}:${String(randomStartMinute).padStart(2, '0')}`;
	const firstShiftDuration = onClockDurations[0] / 60;

	const firstShift = {
		clockInTime: dayStartTime,
		clockOutTime: calculateTimeAfterElapsed(dayStartTime, firstShiftDuration),
		duration: firstShiftDuration * 60,
	};

	shifts.push(firstShift);

	for (let shift = 1; shift <= numberofShifts; shift++) {
		const prevClockOutTime = shifts[shift - 1].clockOutTime;

		const clockInTime = calculateTimeAfterElapsed(
			prevClockOutTime,
			offClockDurations[shift - 1],
		);
		const shiftDuration = onClockDurations[shift] / 60;
		const clockOutTime = calculateTimeAfterElapsed(clockInTime, shiftDuration);

		const shiftToAdd = {
			clockInTime,
			clockOutTime,
			duration: shiftDuration * 60,
		};

		shifts.push(shiftToAdd);
	}

	return shifts;
}

export function createSampleDays(numberOfDays: number) {
	const workDayArray: any[] = [];

	const workedDays: string[] = [];

	for (let day = 0; day <= numberOfDays; day++) {
		const date = getRandomDateInRange('2026-01-01', '2026-12-31');
		const dateExists = workedDays.includes(date);

		if (!dateExists) {
			workedDays.push(date);
		}
	}

	workedDays.forEach((day) => {
		const numberOfShifts = Math.floor(Math.random() * 2 + 1);
		const shifts = createSampleShifts(numberOfShifts);

		const numberofOrders = Math.floor(Math.random() * 15 + 1);
		const orders: any[] = [];

		for (let shift = 1; shift <= numberOfShifts; shift++) {
			let availableOrderStartTime = shifts[shift - 1].clockInTime;
			const availableOrderEndTime = shifts[shift - 1].clockOutTime;

			for (let order = 1; order <= numberofOrders; order++) {
				const { generatedOrder, endDeadheadTime } = createSampleOrder(
					availableOrderStartTime,
					availableOrderEndTime,
					day,
					order,
				);

				if (generatedOrder) {
					orders.push(generatedOrder);
					availableOrderStartTime = endDeadheadTime;
				}
			}
		}

		const totals = calculateDayTotals(shifts, orders);

		const generatedDay = {
			id: `workDay - ${day}`,
			date: day,
			shifts,
			totalTime: totals.totalTime,
			orders,
			activeTime: totals.activeTime,
			idleTime: totals.activeTime,
			totalPay: totals.totalPay,
		};

		workDayArray.push(generatedDay);
	});

	return workDayArray;
}

function getRandomTimeInRange(startTime: string, endTime: string): string {
	const startMinutes = parseTimeToMinutes(startTime);
	let endMinutes = parseTimeToMinutes(endTime);

	if (endMinutes < startMinutes) {
		endMinutes += 24 * 60;
	}

	const randomMinutes =
		startMinutes + Math.floor(Math.random() * (endMinutes - startMinutes + 1));
	const normalizedMinutes = randomMinutes % (24 * 60);

	const hh = Math.floor(normalizedMinutes / 60)
		.toString()
		.padStart(2, '0');
	const mm = (normalizedMinutes % 60).toString().padStart(2, '0');

	return `${hh}:${mm}`;
}

function createSampleOrder(
	availableStartTime: string,
	availableEndTime: string,
	date: string,
	orderNumber: number,
) {
	const serviceOptions = ['GrubHub', 'DoorDash', 'UberEats'];
	const restaurantOptions = [
		'McDonalds',
		'Whataburger',
		'Killer Burger',
		'Chick-fil-A',
		'Panda Express',
	];

	const startTime = getRandomTimeInRange(availableStartTime, availableEndTime);

	let availableDuration =
		parseDurationToSeconds(availableEndTime) -
		parseDurationToSeconds(startTime);

	if (availableDuration < 900) return {} as any;

	const toRestaurant = Math.floor(
		Math.random() * (availableDuration - 180) + 60,
	);
	const restArrivalTime = calculateTimeAfterElapsed(startTime, toRestaurant);
	availableDuration -= toRestaurant;

	const atRestaurant = Math.floor(
		Math.random() * (availableDuration - 120) + 60,
	);
	const restDepartureTime = calculateTimeAfterElapsed(
		restArrivalTime,
		atRestaurant,
	);
	availableDuration -= atRestaurant;

	const toCustomer = Math.floor(Math.random() * (availableDuration - 60) + 60);
	const deliveryTime = calculateTimeAfterElapsed(restDepartureTime, toCustomer);
	availableDuration -= toCustomer;

	const returnToHotspot = Math.floor(Math.random() * availableDuration + 60);
	const endDeadheadTime = calculateTimeAfterElapsed(
		deliveryTime,
		returnToHotspot,
	);

	const totalDuration =
		toRestaurant + atRestaurant + toCustomer + returnToHotspot;

	const service =
		serviceOptions[Math.floor(Math.random() * (serviceOptions.length - 1))];
	const restaurant =
		restaurantOptions[
			Math.floor(Math.random() * (restaurantOptions.length - 1))
		];

	const miles = Number(
		(Math.random() * (((toRestaurant + toCustomer) / 3600) * 40) + 1).toFixed(
			1,
		),
	);

	const grossPay = Number((Math.random() * 30 + 5).toFixed(2));
	const netPay = grossPay - miles * 0.67;
	const grossHourly = grossPay / (totalDuration / 3600);
	const netHourly = netPay / (totalDuration / 3600);

	const generatedOrder = {
		id: generateId(),
		date,
		service,
		restaurant,
		miles,
		timestamps: {
			startTime,
			restArrivalTime,
			restDepartureTime,
			deliveryTime,
			endDeadheadTime,
		},
		segments: {
			toRestaurant,
			atRestaurant,
			toCustomer,
			returnToHotspot,
		},
		totalDuration,
		pay: {
			gross: grossPay,
			net: netPay,
			grossHourly,
			netHourly,
		},
	};

	return { generatedOrder, endDeadheadTime };
}
