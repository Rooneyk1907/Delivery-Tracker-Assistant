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
import colors from '@/constants/Colors';
import useActiveTracking from '@/hooks/useActiveTracking';
import { addOrder, getOrder, updateOrder } from '@/hooks/useOrdersStorage';
import { ActiveOrder } from '@/types/order';

const SERVICES = ['GrubHub', 'DoorDash', 'UberEats'];

function formatTimeHHMM(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function secondsBetween(msStart: number, msEnd: number) {
    return Math.round((msEnd - msStart) / 1000);
}

function formatElapsed(ms: number) {
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
  // const { addOrder, updateOrder, getOrder } = useOrdersStorage();
  const { saveTracking, loadTracking, clearTracking } = useActiveTracking();

  const todayDate = new Date().toISOString().slice(0, 10);
  const [service, setService] = useState<string>(SERVICES[0]);
  const [restaurant, setRestaurant] = useState<string>('');
  const [pay, setPay] = useState<string>('');
  const [miles, setMiles] = useState<string>('');

  const [hourlyGross, setHourlyGross] = useState<number>(0);
  const [hourlyNet, setHourlyNet] = useState<number>(0);

  const [phase, setPhase] = useState<'idle' | 'toRestaurant' | 'waiting' | 'toCustomer' | 'returnedToHotspot'>('idle');
  const [phaseStartMs, setPhaseStartMs] = useState<number | null>(null);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [elapsedDisplay, setElapsedDisplay] = useState('00:00:00');
  const [phaseElapsedDisplay, setPhaseElapsedDisplay] = useState('00:00:00');
  const [storedOrderId, setStoredOrderId] = useState<string | null>(null);

  const startMsRef = useRef<number | null>(null);
  const phaseStartMsRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (startMs && pay) {
        const payNum = parseFloat(pay) || 0;
        const orderMiles = parseFloat(miles) || 0;
        const elapsed = Date.now() - startMs;
        setHourlyGross(calculateHourlyGross(payNum, elapsed));
        setHourlyNet(calculateHourlyNet(payNum, orderMiles, elapsed))
    }
  }, [elapsedDisplay, pay, miles, startMs]);

  // Load active tracking on mount
  useEffect(() => {
    (async () => {
      const active = await loadTracking();
      if (active) {
        setService(active.service);
        setRestaurant(active.restaurant);
        setPay(active.pay);
        setMiles(active.miles);
        setPhase(active.phase);
        setStartMs(active.startMs);
        startMsRef.current = active.startMs;
        setPhaseStartMs(active.phaseStartMs);
        phaseStartMsRef.current = active.phaseStartMs;
        setStoredOrderId(active.storedOrderId);
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

  // Save state whenever tracking phase/times change
  useEffect(() => {
    if (phase !== 'idle' && startMs && phaseStartMs && storedOrderId) {
      saveTracking({
        storedOrderId,
        service: service as 'GrubHub' | 'DoorDash' | 'UberEats',
        restaurant,
        pay,
        miles,
        phase: phase as 'toRestaurant' | 'waiting' | 'toCustomer' | 'returnedToHotspot',
        startMs,
        phaseStartMs,
        grossHourlyPay: hourlyGross,
        netHourlyPay: hourlyNet,
      });
    }
  }, [phase, startMs, phaseStartMs, storedOrderId, service, restaurant, pay, miles]);

  async function createAndStartOrder() {
    const now = new Date();
    const startTimeStr = formatTimeHHMM(now);

    const baseOrder: ActiveOrder = {
      date: todayDate,
      service: service as 'GrubHub' | 'DoorDash' | 'UberEats',
      restaurant,
      pay: parseFloat(pay) || 0,
      miles: parseFloat(miles) || 0,
      startTime: startTimeStr,
      restArrivalTime: '',
      restDepartureTime: '',
      deliveryTime: '',
      segments: {
        toRestaurant: 0,
        atRestaurant: 0,
        toCustomer: 0,
        returnToHotspot: 0,
      },
      totalDuration: '',
      grossHourlyPay: 0,
      netHourlyPay: 0,
    };

    const stored = await addOrder(baseOrder);
    setStoredOrderId(stored.id);

    const ms = Date.now();
    setStartMs(ms);
    startMsRef.current = ms;
    setPhaseStartMs(ms);
    phaseStartMsRef.current = ms;
    setPhase('toRestaurant');
    setElapsedDisplay('00:00:00');
    setPhaseElapsedDisplay('00:00:00');
    startInterval();
  }

  async function updateSegmentSeconds(segmentKey: keyof ActiveOrder['segments'], seconds: number) {
    if (!storedOrderId) return;
    try {
      const existing = await getOrder(storedOrderId);
      const prevSegments = existing?.segments ?? { toRestaurant: 0, atRestaurant: 0, toCustomer: 0, returnToHotspot: 0 };
      const updatedSegments = { ...prevSegments, [segmentKey]: seconds };
      await updateOrder(storedOrderId, { segments: updatedSegments } as any);
    } catch (err) {
      console.error('updateSegmentSeconds failed', err);
    }
  }

  async function handleStart() {
    await createAndStartOrder();
  }

  async function handleArriveAtRestaurant() {
    if (!startMs || !phaseStartMs) return;
    const now = Date.now();
    const seconds = secondsBetween(startMs, now);
    await updateSegmentSeconds('toRestaurant', seconds);
    await updateOrder(storedOrderId!, { restArrivalTime: formatTimeHHMM(new Date(now)) } as any);
    setPhase('waiting');
    setPhaseStartMs(now);
    phaseStartMsRef.current = now;
    setPhaseElapsedDisplay('00:00:00');
    startInterval();
  }

  async function handleDepartRestaurant() {
    if (!phaseStartMs) return;
    const now = Date.now();
    const seconds = secondsBetween(phaseStartMs, now);
    await updateSegmentSeconds('atRestaurant', seconds);
    await updateOrder(storedOrderId!, { restDepartureTime: formatTimeHHMM(new Date(now)) } as any);
    setPhase('toCustomer');
    setPhaseStartMs(now);
    phaseStartMsRef.current = now;
    setPhaseElapsedDisplay('00:00:00');
    startInterval();
  }

  async function handleOrderDelivered() {
    if (!phaseStartMs) return;
    const now = Date.now();
    const seconds = secondsBetween(phaseStartMs, now);
    await updateSegmentSeconds('toCustomer', seconds);
    await updateOrder(storedOrderId!, { 
      deliveryTime: formatTimeHHMM(new Date(now)),
      grossHourlyPay: hourlyGross,
      netHourlyPay: hourlyNet,
     } as any);
    setPhase('returnedToHotspot');
    setPhaseStartMs(now);
    phaseStartMsRef.current = now;
    setPhaseElapsedDisplay('00:00:00');
    startInterval();
  }

  async function handleReturnToHotspot() {
    if (!phaseStartMs) return;
    const now = Date.now();
    const seconds = secondsBetween(phaseStartMs, now);
    await updateSegmentSeconds('returnToHotspot', seconds);
    if (startMs) {
      const totalMs = now - startMs;
      const hh = Math.floor(totalMs / 3600000).toString().padStart(2, '0');
      const mm = Math.floor((totalMs % 3600000) / 60000).toString().padStart(2, '0');
      const ss = Math.floor((totalMs % 60000) / 1000).toString().padStart(2, '0');
      await updateOrder(storedOrderId!, { 
        totalDuration: `${hh}:${mm}:${ss}`,
        grossHourlyPay: hourlyGross,
        netHourlyPay: hourlyNet 
      } as any);
    }

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
      case 'returnedToHotspot': return { label: 'Return Complete', action: handleReturnToHotspot, color: styles.start };
      default: return { label: 'Start', action: handleStart, color: styles.start };
    }
  })();

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

          <CurrencyInput label="Pay ($)" value={pay} onChangeText={setPay} />
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

            {phase !== 'idle' && phase !== 'returnedToHotspot' && (
              <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleReturnToHotspot}>
                <Text style={styles.buttonText}>Cancel / Return</Text>
              </TouchableOpacity>
            )}

            {phase === 'returnedToHotspot' && (
              <TouchableOpacity style={[styles.button, styles.start]} onPress={handleNewOrderReceived}>
                <Text style={styles.buttonText}>New Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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