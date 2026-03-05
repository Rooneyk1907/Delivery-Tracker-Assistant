import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CurrencyInput from '@/components/currencyInput';
import MileageInput from '@/components/mileageInput';
import ClockInOut from '@/components/clockInOut';

import colors from '@/constants/Colors';


import {TotalPay, Shift, WorkDay} from '@/types/workday';
import Order, {Timestamps, Segments, Pay} from '@/types/order';

import { liveTracking, workDay, ActiveTrackingState, StoredOrder
  // completedOrders,
 } from '@/hooks/useStorage'

import { generateId, formatTimeHHMM, secondsBetween, formatElapsed, calculateShiftDuration, calculateDayTotals, parseDurationToSeconds, secondsToHHMMSS } from '@/helpers/helper'

// TODO: Services should be input by user in settings and saved to .env file
const SERVICES = ['GrubHub', 'DoorDash', 'UberEats'];


function calculateHourlyGross(payAmount: number, elapsedMs: number): number {
  if (elapsedMs === 0) return 0;
  const hours = elapsedMs / (1000 * 60 * 60);
  return payAmount / hours;
}

function calculateHourlyNet(payAmount: number, miles: number, elapsedMs: number): number {
  if (elapsedMs === 0) return 0;

  const hours = elapsedMs / (1000 * 60 * 60);
  const estimatedDeduction = miles * 0.67;

  const estimatedNet = payAmount - estimatedDeduction;

  return estimatedNet / hours;
}

export default function LiveTracker() {
  const trackingStore = liveTracking(); // loads the live tracking (individual order)
  const dayStore = workDay(); // loads the workDay (day, shift, orders, etc...)

  const { save: saveTracking, load: loadTracking, clear: clearTracking, update: updateTracking} = trackingStore;
  const { loadAll, add, update, getById, getWorkDay } = dayStore;

  const todayDate = new Date().toISOString().slice(0, 10);

  

  const [isLoading, setIsLoading] = useState(true);
  const [onClock, setOnClock] = useState(false);
  
  const [storedOrderId, setStoredOrderId] = useState<string | null>(null);

  const [service, setService] = useState<string>(SERVICES[0]);
  const [restaurant, setRestaurant] = useState<string>('');
  const [miles, setMiles] = useState<number>(0);
  
  const [activeShiftId, setActiveShiftId] = useState<string>('');
  const [date, setDate] = useState<string>('')
  
  const [shifts, setShifts] = useState<Shift[]>([])
  const [clockInTime, setClockInTime] = useState('');
  const [clockOutTime, setClockOutTime] = useState('')
  const [duation, setDuration] = useState('')
  
  const [totalTime, setTotalTime] = useState<string>('');
  
  const [orders, setOrders] = useState<Order[]>([])
  const [phase, setPhase] = useState<'idle' | 'toRestaurant' | 'waiting' | 'toCustomer' | 'returnToHotspot'>('idle');
  const [phaseStartMs, setPhaseStartMs] = useState<number | null>(null);
  const [startMs, setStartMs] = useState<number | null>(null);
  const startMsRef = useRef<number | null>(null);
  const phaseStartMsRef = useRef<number | null>(null);
  
  const [timestamps, setTimestamps] = useState<Timestamps>();
  const [segments, setSegments] = useState<Segments>();
  const [totalDuration, setTotalDuration] = useState<number>();
  const [orderPay, setOrderPay] = useState<Pay>();

  const [totalPay, setTotalPay] = useState<TotalPay>();
  const [grossPay, setGrossPay] = useState<number>(0);
  const [netPay, setNetPay] = useState<number>(0);
  const [hourlyGross, setHourlyGross] = useState<number>(0);
  const [hourlyNet, setHourlyNet] = useState<number>(0);
  
  const [elapsedDisplay, setElapsedDisplay] = useState('00:00:00');
  const [phaseElapsedDisplay, setPhaseElapsedDisplay] = useState('00:00:00');

  const intervalRef = useRef<number | null>(null);
  

  useEffect(() => {
    if (startMs && grossPay) {
        const payNum = grossPay || 0;
        const orderMiles = miles || 0;
        const elapsed = Date.now() - startMs;
        setNetPay(payNum - orderMiles * 0.67);
        setHourlyGross(calculateHourlyGross(payNum, elapsed));
        setHourlyNet(calculateHourlyNet(payNum, orderMiles, elapsed))
    }
  }, [elapsedDisplay, grossPay, miles, startMs]);

  // Load active tracking on mount
  useEffect(() => {
    (async () => {
      const activeShift = await checkClockedIn();
      if (activeShift) {
        setActiveShiftId(activeShift.id);
        setShifts(activeShift.shifts);
        setTotalTime(activeShift.totalTime);
        setOrders(activeShift.orders);
        setTotalPay(activeShift.totalPay);
        
      }

      const activeOrder = await loadTracking();
      if (activeOrder) {
        setService(activeOrder.service);
        setRestaurant(activeOrder.restaurant);
        setGrossPay((activeOrder.pay.gross));
        setNetPay((activeOrder.pay.net));
        setMiles((activeOrder.miles));
        setPhase(activeOrder.phase);
        setSegments(activeOrder.segments);
        setTimestamps(activeOrder.timestamps);
        setStartMs(activeOrder.startMs);
        startMsRef.current = activeOrder.startMs;
        setPhaseStartMs(activeOrder.phaseStartMs);
        phaseStartMsRef.current = activeOrder.phaseStartMs;
        setStoredOrderId(activeOrder.id);
        startInterval();
      }
      setIsLoading(false);
    })();

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);


  function startInterval() {
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const s = startMsRef.current;
      const p = phaseStartMsRef.current;
      if (s) setElapsedDisplay(formatElapsed(now - s));
      if (p) setPhaseElapsedDisplay(formatElapsed(now - p));
    }, 1000) as unknown as number;
  }

  async function createAndStartOrder() {
    const startTime = formatTimeHHMM(new Date());

    const ms = Date.now();
    setStartMs(ms);
    startMsRef.current = ms;
    setPhaseStartMs(ms);
    phaseStartMsRef.current = ms;
    setPhase('toRestaurant');

    const activeOrder: ActiveTrackingState = {
      id: generateId(),
      date: todayDate,
      service: service as 'GrubHub' | 'DoorDash' | 'UberEats',
      restaurant,
      miles: miles || 0,
      timestamps: {
        startTime: startTime,
        restArrivalTime: '',
        restDepartureTime: '',
        deliveryTime: '',
        endDeadheadTime: '',
      },
      segments: {
        toRestaurant: 0,
        atRestaurant: 0,
        toCustomer: 0,
        returnToHotspot: 0,
      },
      totalDuration: 0,
      pay: {
        gross: grossPay || 0,
        net: grossPay - miles * 0.67,
        grossHourly: 0,
        netHourly: 0,
      },
      phase: 'toRestaurant',
      startMs: ms,
      phaseStartMs: ms
    };

    await saveTracking(activeOrder);

    setElapsedDisplay('00:00:00');
    setPhaseElapsedDisplay('00:00:00');
    startInterval();
  }

  async function handleStart() {
    await createAndStartOrder();
  }

  async function handleArriveAtRestaurant() {
    if (!startMs || !phaseStartMs) return;
    const now = Date.now();

    const seconds = secondsBetween(phaseStartMs, now);
    const restArrivalTime = formatTimeHHMM(new Date())
    const existing = await loadTracking();
    
    if (existing) {
      const updatedTimestamps= {...existing.timestamps, restArrivalTime }
      const updatedSegments = {...existing.segments, toRestaurant: seconds}

      await updateTracking({ 
        timestamps: updatedTimestamps, 
        segments: updatedSegments,
        phase: 'waiting',
        phaseStartMs: now,
      });
      
      setPhase('waiting');
      setPhaseStartMs(now);
      
      phaseStartMsRef.current = now;
      setPhaseElapsedDisplay('00:00:00');

      startInterval();

    } else {
      throw new Error('handleArriveAtRestaurant failed!')
    }
  }

  async function handleDepartRestaurant() {
    if (!phaseStartMs) return;
    const now = Date.now();

    const seconds = secondsBetween(phaseStartMs, now);
    const restDepartureTime = formatTimeHHMM(new Date())
    const existing = await loadTracking()

    if (existing) {
      const updatedTimeStamps = { ...existing.timestamps, restDepartureTime }
      const updatedSegments = {...existing.segments, atRestaurant: seconds}
      console.log('updatedSegments Depart', updatedSegments)

      await updateTracking({
        timestamps: updatedTimeStamps, 
        segments: updatedSegments,
        phase: 'toCustomer',
        phaseStartMs: now,
      });
      
      setPhase('toCustomer');
      setPhaseStartMs(now);
      phaseStartMsRef.current = now;
      setPhaseElapsedDisplay('00:00:00');
      startInterval();
    } else {
      throw new Error('handleDepartRestaurant failed!')
    }
  }

  async function handleOrderDelivered() {
    if (!phaseStartMs) return;
    const now = Date.now();

    const seconds = secondsBetween(phaseStartMs, now);
    const deliveryTime = formatTimeHHMM(new Date())
    const existing = await loadTracking();

    if (existing) {
      const updatedTimeStamps = {...existing.timestamps, deliveryTime}
      const updatedSegments = {...existing.segments, toCustomer: seconds}

      await updateTracking({
        timestamps: updatedTimeStamps,
        segments: updatedSegments,
        phase:'returnToHotspot',
        phaseStartMs: now,
      })

      setPhase('returnToHotspot');
      setPhaseStartMs(now);
      phaseStartMsRef.current = now;
      setPhaseElapsedDisplay('00:00:00');
      startInterval();
    } else {
      throw new Error('handleOrderDelivered failed!')
    }
  }

  async function handleReturnToHotspot() {
    if (!phaseStartMs) return;
    const now = Date.now();

    const seconds = secondsBetween(phaseStartMs, now);
    const endDeadheadTime = formatTimeHHMM(new Date())
    const existing = await loadTracking();

    if (existing) {
      const updatedTimestamps = {...existing.timestamps, endDeadheadTime}
      const updatedSegments = {...existing.segments, returnToHotspot: seconds}

      const startMs = existing.startMs
      const totalSeconds = (now - startMs) / 1000;
      const totalHours = totalSeconds / 3600;

      const pay = {
          ...existing.pay,
          grossHourly: existing.pay.gross / totalHours,
          grossNet: existing.pay.net / totalHours,
        }
        console.log('pay', pay)
        
        await updateTracking({
          timestamps: updatedTimestamps, 
          segments: updatedSegments, 
          totalDuration: totalSeconds, 
          pay: pay})
      
        await handleSaveToLongTerm()

        setPhase('idle');
        setPhaseStartMs(null);

        phaseStartMsRef.current = null;
        setStartMs(null);
        startMsRef.current = null;
        setStoredOrderId(null);
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setElapsedDisplay('00:00:00');
        setPhaseElapsedDisplay('00:00:00');
        await clearTracking();
      } else {
        throw new Error('handleReturnToHotspot failed!')
      } 
  }

  async function handleSaveToLongTerm() {
    const trackedOrder = await loadTracking();
    const currentWorkDay = await getWorkDay(todayDate);

    if (trackedOrder && currentWorkDay) {
      const completedOrder: StoredOrder = {
        id: trackedOrder.id,
        date: trackedOrder.date,
        service: trackedOrder.service,
        restaurant: trackedOrder.restaurant,
        miles: trackedOrder.miles,
        timestamps: trackedOrder.timestamps,
        segments: trackedOrder.segments,
        totalDuration: trackedOrder.totalDuration,
        pay: trackedOrder.pay,
        savedAt: new Date().toISOString()
      } 

      const updatedTotals = calculateDayTotals(currentWorkDay.shifts, [...currentWorkDay.orders, completedOrder])
      console.log('updatedTotals in handleSave', updatedTotals)

      const updatedWorkDay: WorkDay = {
        id: currentWorkDay.id,
        date: currentWorkDay.date,
        shifts: currentWorkDay.shifts,
        totalTime: updatedTotals.totalTime,
        orders: [...currentWorkDay.orders, completedOrder],
        activeTime: updatedTotals.activeTime,
        idleTime: updatedTotals.idleTime,
        totalPay: updatedTotals.totalPay,
      }

      console.log('updatedWorkDay in handleSave', updatedWorkDay)

      await update(currentWorkDay.id, updatedWorkDay)
    } else {
      throw new Error('handleSaveToLongTerm failed!')
    }
  }

  async function handleNewOrderReceived() {
    await createAndStartOrder();
  }

  const primaryAction = (() => {
    switch (phase) {
      case 'idle': return { label: 'Start Tracking', action: handleStart, color: styles.start };
      case 'toRestaurant': return { label: 'Arrived', action: handleArriveAtRestaurant, color: styles.stop };
      case 'waiting': return { label: 'Depart', action: handleDepartRestaurant, color: styles.stop };
      case 'toCustomer': return { label: 'Delivered', action: handleOrderDelivered, color: styles.stop };
      case 'returnToHotspot': return { label: 'Return Complete', action: handleReturnToHotspot, color: styles.start };
      default: return { label: 'Start', action: handleStart, color: styles.start };
    }
  })();

  function handleClockInText() {
    console.log('handleClockInText')
  }

  async function handleClockIn() {
    const existingWorkDay = await checkClockedIn();
    const inTime = clockInTime.trim() || formatTimeHHMM(new Date())

    setClockInTime(inTime);
    setDate(todayDate)
    setOnClock(true)

    if (existingWorkDay) {
      setActiveShiftId(existingWorkDay.id)  
 
      const newShift: Shift = {
        clockInTime: inTime,
        clockOutTime: '',
        duration: 0,
      } 
      await update(existingWorkDay.id, { 
        shifts: [...existingWorkDay.shifts, newShift],
      })
      return;
    } 

    const newWorkDayId = generateId()
    const newWorkDay: WorkDay = {
      id: generateId(),
      date: todayDate,
      shifts: [{
          clockInTime: inTime,
          clockOutTime: '',
          duration: 0,
        }],
      totalTime: '',
      orders: [],
      activeTime: '',
      idleTime: '',
      totalPay: {
        gross: 0,
        net: 0,
        activeHourlyGross: 0,
        activeHourlyNet: 0,
        overallHourlyGross: 0,
        overallHourlyNet: 0,
      }
      }        
      await add(newWorkDay);
      
      setActiveShiftId(newWorkDayId)

      return;
    }

  function handleClockOutText() {
    console.log('handleClockOutText')

  }

  async function handleClockOut() {
    const activeWorkDay = await getWorkDay(todayDate);
    if (!activeWorkDay) return;

    const outTime = clockOutTime.trim() || formatTimeHHMM(new Date())
    setClockOutTime(outTime);
    setOnClock(false)

    const openShiftIndex = shifts.findIndex( shift => !!shift.clockInTime && !shift.clockOutTime)
    if (openShiftIndex === -1 ) return;

    const nextShifts = activeWorkDay.shifts.map((shift, index) => {
      return index === openShiftIndex 
        ? {
          ...shift,
          clockOutTime: outTime,
          duration: Number(calculateShiftDuration(shift.clockInTime, outTime))
        } : shift
    });
    
    const totals = calculateDayTotals(nextShifts, activeWorkDay.orders)

    const updatedWorkDay: WorkDay = {
      ...activeWorkDay,
      shifts: nextShifts,
      totalTime: totals.totalTime,
      activeTime: totals.activeTime,
      idleTime: totals.idleTime,
      totalPay: totals.totalPay,
    }
    
    await update(activeWorkDay.id, updatedWorkDay)

    setShifts(nextShifts)
    setClockInTime('');
    setClockOutTime('');
  }
  

  async function checkClockedIn() {
    
    const existingWorkDay = await getWorkDay(todayDate)

    if (existingWorkDay) {
      const { shifts } = existingWorkDay;      
      // search through arrays to find if there is one where clockInTime is filled, but clockOutTime is not.
      const openShiftIndex = shifts.findIndex((shift) => !!shift.clockInTime && !shift.clockOutTime)
      // if there is an open shift
      if (openShiftIndex !== -1) {
        setClockInTime(shifts[openShiftIndex].clockInTime);
        setOnClock(true);        
      }

      return existingWorkDay; 
    }
    return null;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.container, { justifyContent: 'center' }]}>
          <Text style={{ color: colors.labelText }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
     
      {/* Displays live tracker if on active shift */}
      {onClock ? (
        <View style={styles.card}>
          <Text style={styles.title}>Live Tracker</Text>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Date</Text>
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyText}>{todayDate}</Text>
              </View>
            </View>

            <View>
              <Text style={styles.label}>Start Time</Text>
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyText}>
                  {startMs ? formatTimeHHMM(new Date(startMs)) : '--:--'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Service</Text>
            <View style={styles.row}>
              {SERVICES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.serviceButton,
                    service === s && styles.serviceButtonActive,
                    phase !== 'idle' && service === s ? { opacity: 0.8 } : null,
                  ]}
                  onPress={() => { if (phase === 'idle') setService(s); }}
                >
                  <Text style={[styles.serviceText, service === s && styles.serviceTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Restaurant</Text>
            <TextInput
              style={styles.input}
              value={restaurant}
              onChangeText={setRestaurant}
              placeholder="Restaurant"
              editable={phase === 'idle'}
            />
          </View>

          <CurrencyInput label="Pay ($)" value={grossPay} onChangeText={setGrossPay} />
          <MileageInput label="Miles" value={miles} onChangeText={setMiles} />

          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              {phase === 'idle' ? 'Not tracking' : phase === 'toRestaurant' ? `En route to ${restaurant || 'restaurant'}` :
               phase === 'waiting' ? `Waiting at ${restaurant || 'restaurant'}` :
               phase === 'toCustomer' ? `En route to customer` :
               `Returned to hotspot`}
            </Text>

            <Text style={styles.elapsed}>{elapsedDisplay}</Text>

             {phase !== 'idle' && (
              <>
                <Text style={[styles.statusLabel, { marginTop: 12 }]}>Hourly Gross</Text>
                <Text style={[styles.elapsed, { fontSize: 18, color: colors.success }]}>
                  ${hourlyGross.toFixed(2)}/hr
                </Text>
                <Text>Net Hourly</Text>
                <Text>${hourlyNet.toFixed(2)}</Text>
              </>)}

            <Text style={[styles.statusLabel, { marginTop: 6 }]}>Current phase</Text>
            <Text style={[styles.elapsed, { fontSize: 16 }]}>{phaseElapsedDisplay}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, primaryAction.color]} onPress={primaryAction.action}>
              <Text style={styles.buttonText}>{primaryAction.label}</Text>
            </TouchableOpacity>

            {phase !== 'idle' && phase !== 'returnToHotspot' && (
              <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleReturnToHotspot}>
                <Text style={styles.buttonText}>Cancel / Return</Text>
              </TouchableOpacity>
            )}

            {phase === 'returnToHotspot' && (
              <TouchableOpacity style={[styles.button, styles.start]} onPress={handleNewOrderReceived}>
                <Text style={styles.buttonText}>New Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (null)}

       <ClockInOut 
        activeShift={onClock} 
        clockInTime={clockInTime} 
        handleClockIn={handleClockIn} 
        handleClockInText={handleClockInText} 
        clockOutTime={clockOutTime} 
        handleClockOut={handleClockOut}
        handleClockOutText={handleClockOutText}  />
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  container: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 120,
    maxWidth: 640,
  },
  card: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  inputSection: { marginTop: 12 },
  label: {
    fontSize: 10,
    color: colors.labelText,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  readonlyField: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minWidth: 120,
    alignItems: 'center',
  },
  readonlyText: { color: colors.dark, fontWeight: '600' },
  serviceButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
    marginRight: 8,
  },
  serviceButtonActive: { backgroundColor: colors.primary },
  serviceText: { color: colors.dark, fontWeight: '600' },
  serviceTextActive: { color: '#fff' },
  input: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: colors.dark,
  },
  statusCard: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f7fbff',
    alignItems: 'center',
  },
  statusText: { color: colors.dark, fontWeight: '700', marginBottom: 8 },
  statusLabel: { color: colors.labelText, fontWeight: '600', fontSize: 12 },
  elapsed: { fontSize: 20, fontWeight: '700', color: colors.primary },
  buttonRow: { marginTop: 16, flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  start: { backgroundColor: colors.success },
  stop: { backgroundColor: colors.warning },
  danger: { backgroundColor: '#e74c3c' },
  buttonText: { color: '#fff', fontWeight: '700', textTransform: 'uppercase' },
});