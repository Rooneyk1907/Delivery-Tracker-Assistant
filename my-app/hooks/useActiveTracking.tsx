import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_TRACKING_KEY = '@active_tracking';

export interface ActiveTrackingState {
  storedOrderId: string;
  service: 'GrubHub' | 'DoorDash' | 'UberEats';
  restaurant: string;
  pay: string;
  miles: string;
  phase: 'toRestaurant' | 'waiting' | 'toCustomer' | 'returnedToHotspot';
  startMs: number;
  phaseStartMs: number;
}

export default function useActiveTracking() {
  async function saveTracking(state: ActiveTrackingState): Promise<void> {
    try {
      await AsyncStorage.setItem(ACTIVE_TRACKING_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('useActiveTracking: saveTracking failed', err);
    }
  }

  async function loadTracking(): Promise<ActiveTrackingState | null> {
    try {
      const stored = await AsyncStorage.getItem(ACTIVE_TRACKING_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as ActiveTrackingState;
    } catch (err) {
      console.error('useActiveTracking: loadTracking failed', err);
      return null;
    }
  }

  async function clearTracking(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACTIVE_TRACKING_KEY);
    } catch (err) {
      console.error('useActiveTracking: clearTracking failed', err);
    }
  }

  return { saveTracking, loadTracking, clearTracking };
}