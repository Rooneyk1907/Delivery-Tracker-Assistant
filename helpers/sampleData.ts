import Order from '@/types/order'
import { parseTimeToMinutes, calculateDayTotals, parseDurationToSeconds} from '@/helpers/helper'
import { Shift, WorkDay } from '@/types/workday'

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min
}

function round2(value: number): number {
    return Number(value.toFixed(2))
}

function minutesToHHMM(totalMinutes: number): string {
    const totalMinutesInDay = 24 * 60
    const normalizedMinutes = ((totalMinutes % totalMinutesInDay) + totalMinutesInDay) % totalMinutesInDay

    const hh = Math.floor(normalizedMinutes / 60).toString().padStart(2, '0')
    const mm = (normalizedMinutes % 60).toString().padStart(2, '0')

    return `${hh}:${mm}`
}

function calculateTimeAfterElapsed(startTime: string, elapsedSeconds: number) {
    const startMinutes = parseTimeToMinutes(startTime)
    const elapsedMinutes = Math.floor(elapsedSeconds / 60)
    return minutesToHHMM(startMinutes + elapsedMinutes)
}

function getRandomDateInRange(startDate: string, endDate: string): string {
    const start = new Date(`${startDate}T00:00:00Z`).getTime();
    const end = new Date(`${endDate}T00:00:00Z`).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
        throw new Error('Invalid date. use YYYY-MM-DD')
    }

    if (end < start) {
        throw new Error('endDate must be >= startDate')
    }

    const randomMs = start + Math.floor(Math.random() * (end - start + 1));
    return new Date(randomMs).toISOString().slice(0, 10)
}

function splitOrderSegments(totalDuration: number) {
    const minToRestaurant = 2 * 60
    const minAtRestaurant = 2 * 60
    const minToCustomer = 4 * 60
    const minReturn = 2 * 60

    const baseTotal = minToRestaurant + minAtRestaurant + minToCustomer + minReturn
    const extra = Math.max(0, totalDuration - baseTotal)

    const toRestaurantExtra = randInt(0, Math.floor(extra * 0.25))
    const atRestaurantExtra = randInt(0, Math.floor(extra * 0.30))
    const toCustomerExtra = randInt(0, Math.floor(extra * 0.35))
    const used = toRestaurantExtra + atRestaurantExtra + toCustomerExtra
    const returnExtra = Math.max(0, extra - used)

    return {
        toRestaurant: minToRestaurant + toRestaurantExtra,
        atRestaurant: minAtRestaurant + atRestaurantExtra,
        toCustomer: minToCustomer + toCustomerExtra,
        returnToHotspot: minReturn + returnExtra,
    }
}

function pickService(): string {
    const roll = Math.random()
    if (roll < 0.15) return 'DoorDash'
    if (roll < 0.25) return 'UberEats'
    return 'GrubHub'
}

function pickRestaurant(service: string): string {
    const serviceRestaurantOptions: Record<string, string[]> = {
        DoorDash: ['McDonalds', 'Chick-fil-A', 'Panda Express', 'Whataburger'],
        UberEats: ['McDonalds', 'Killer Burger', 'Panda Express', 'Whataburger'],
        GrubHub: ['Killer Burger', 'Whataburger', 'Chick-fil-A', 'Panda Express'],
    }

    const options = serviceRestaurantOptions[service]
    return options[randInt(0, options.length - 1)]
}

function createSampleShifts(numberOfShifts: number): Shift[] {
    const shifts: Shift[] = []
    let currentMinute = randInt(6 * 60, 9 * 60)

    for (let shiftIndex = 0; shiftIndex < numberOfShifts; shiftIndex++) {
        const durationMinutes = randInt(120, 240)
        const clockInTime = minutesToHHMM(currentMinute)
        const clockOutTime = minutesToHHMM(currentMinute + durationMinutes)

        shifts.push({
            clockInTime,
            clockOutTime,
            duration: durationMinutes * 60,
        })

        if (shiftIndex < numberOfShifts - 1) {
            const breakMinutes = randInt(15, 45)
            currentMinute += durationMinutes + breakMinutes
        }
    }

    return shifts
}

function createOrderWithinShift(date: string, orderId: number, startMinute: number, totalDurationSeconds: number): Order {
    const segments = splitOrderSegments(totalDurationSeconds)
    const startTime = minutesToHHMM(startMinute)
    const restArrivalTime = calculateTimeAfterElapsed(startTime, segments.toRestaurant)
    const restDepartureTime = calculateTimeAfterElapsed(restArrivalTime, segments.atRestaurant)
    const deliveryTime = calculateTimeAfterElapsed(restDepartureTime, segments.toCustomer)
    const endDeadheadTime = calculateTimeAfterElapsed(deliveryTime, segments.returnToHotspot)

    const service = pickService()
    const restaurant = pickRestaurant(service)

    const roadHours = (segments.toRestaurant + segments.toCustomer + segments.returnToHotspot) / 3600
    const miles = Number((Math.max(0.8, roadHours * randFloat(16, 28))).toFixed(1))

    const totalHours = totalDurationSeconds / 3600
    const basePayByService: Record<string, number> = {
        DoorDash: randFloat(2.5, 4.5),
        UberEats: randFloat(2.0, 4.2),
        GrubHub: randFloat(2.8, 5.0),
    }

    const distancePay = miles * randFloat(0.45, 0.9)
    const timePay = totalHours * randFloat(5, 10)
    const tip = randFloat(1.5, 9.5)
    const grossPay = round2(basePayByService[service] + distancePay + timePay + tip)
    const netPay = round2(grossPay - miles * 0.67)
    const grossHourly = round2(grossPay / totalHours)
    const netHourly = round2(netPay / totalHours)

    return {
        id: `order-${date}-${orderId}`,
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
        segments,
        totalDuration: totalDurationSeconds,
        pay: {
            gross: grossPay,
            net: netPay,
            grossHourly,
            netHourly,
        },
    }
}

function createOrdersForShift(date: string, shift: Shift, firstOrderId: number): { orders: Order[]; nextOrderId: number } {
    const orders: Order[] = []
    let nextOrderId = firstOrderId

    const shiftStart = parseTimeToMinutes(shift.clockInTime)
    const shiftDurationMinutes = Math.floor(parseDurationToSeconds(shift.duration) / 60)
    const shiftEnd = shiftStart + shiftDurationMinutes

    // randFloat is a density multiplier for orders-per-hour
    const estimatedOrders = Math.round((shiftDurationMinutes / 60) * randFloat(0.24, 1.7))
    const targetOrders = Math.max(1, Math.min(6, estimatedOrders))

    let cursorMinute = shiftStart

    for (let orderIndex = 0; orderIndex < targetOrders; orderIndex++) {
        const remainingOrders = targetOrders - orderIndex
        const minimumOrderMinutes = 18
        const remainingMinutes = shiftEnd - cursorMinute
        const minimumMinutesNeeded = remainingOrders * minimumOrderMinutes

        if (remainingMinutes < minimumMinutesNeeded) break

        const maxIdleBefore = Math.min(14, remainingMinutes - minimumMinutesNeeded)
        const idleBefore = randInt(0, Math.max(0, maxIdleBefore))
        const orderStartMinute = cursorMinute + idleBefore

        const minutesAfterStart = shiftEnd - orderStartMinute
        const maxThisOrderMinutes = minutesAfterStart - (remainingOrders - 1) * minimumOrderMinutes
        const orderMinutes = randInt(minimumOrderMinutes, Math.min(42, maxThisOrderMinutes))
        const orderDurationSeconds = orderMinutes * 60

        const order = createOrderWithinShift(date, nextOrderId, orderStartMinute, orderDurationSeconds)
        orders.push(order)

        cursorMinute = orderStartMinute + orderMinutes
        nextOrderId += 1
    }

    return { orders, nextOrderId }
}

export function createSampleDays(numberOfDays: number): WorkDay[] {
    const workDayArray: WorkDay[] = []
    const workedDays = new Set<string>()
    let nextOrderId = 1;

    while (workedDays.size < numberOfDays) {
        workedDays.add(getRandomDateInRange('2026-01-01', '2026-12-31'))
    }

    for (const date of workedDays) {
        const numberOfShifts = randInt(1, 3)
        const shifts = createSampleShifts(numberOfShifts)

        let orders: Order[] = []

        for (const shift of shifts) {
            const generated = createOrdersForShift(date, shift, nextOrderId)
            orders = orders.concat(generated.orders)
            nextOrderId = generated.nextOrderId
        }

        const totals = calculateDayTotals(shifts, orders)

        const generatedDay: WorkDay = {
            id: `workDay - ${date}`,
            date,
            shifts,
            totalTime: totals.totalTime,
            orders,
            activeTime: totals.activeTime,
            idleTime: totals.idleTime,
            totalPay: totals.totalPay,
        }

        workDayArray.push(generatedDay)
    }

    return workDayArray
}