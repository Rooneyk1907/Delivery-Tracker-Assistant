import AsyncStorage from '@react-native-async-storage/async-storage';

import { WorkDay, Shift, TotalPay } from '@/types/workday';
import Order from '@/types/order';

import { generateId, parseDurationToSeconds, secondsToHHMMSS } from '@/helpers/helper';

// TODO: move storage keys to .env
const LONG_TERM_STORAGE_KEY = '@long_term_storage'
const TEMP_STORAGE_LIVE_TRACKING_KEY = '@temp_storage_live_tracking'
const TEMP_STORAGE_ORDER_ENTRY_DRAFT_KEY = '@temp_storage_order_entry_draft'

// TYPES //
export interface StoredDay extends WorkDay {
    savedAt: string;
}

export interface ActiveTrackingState extends Order {
    phase: 'toRestaurant' | 'waiting' | 'toCustomer' | 'returnToHotspot';
    startMs: number;
    phaseStartMs: number;
}

export interface StoredOrder extends Order {
    savedAt: string;
}

export interface OrderEntryDraft {
    selectedService: string;
    tripDate: string;
    tripTime: string;
    tripPay: string;
    tripMiles: string;
    tripRestaurant: string;
    tripDuration: string;
}

//  STORAGE FUNCTIONS //

// WORK DAYS ///
export function workDay() {

    async function loadAll(): Promise<StoredDay[]>{
        try {
            const raw = await AsyncStorage.getItem(LONG_TERM_STORAGE_KEY);
            if (!raw) return [];
            
            return JSON.parse(raw) as StoredDay[];
        } catch (error) {
            console.error ('useStorage: loadAllWorkDays failed', error);
            return [];
        }
    }
    
    async function save(workDays: StoredDay[]) {
        try {
            await AsyncStorage.setItem(LONG_TERM_STORAGE_KEY, JSON.stringify(workDays));
        } catch (error) {
            console.error('useStorage: saveWorkDays failed', error)
        }
    }
    
    async function add(workDay: WorkDay): Promise<WorkDay> {
        const allWorkDays = await loadAll();
        
        const stored: StoredDay = {
            ...workDay,
            // id: generateId(),
            savedAt: new Date().toISOString(),
        };
    
        allWorkDays.unshift(stored);

        await save(allWorkDays);
        return stored;
    }

    async function getById(id: string): Promise<StoredDay | undefined> {
        const all = await loadAll();
        return all.find((workDay) => workDay.id === id);
    }

    async function getWorkDay(date: string): Promise<StoredDay | null> {
        const allWorkDays = await loadAll();
        const existingWorkDay = allWorkDays.find(workDay => workDay.date === date)

        if (existingWorkDay) {
            return existingWorkDay
        }

        return null;
    }

    async function update(id: string, patch: Partial<StoredDay>): Promise<StoredDay | undefined> {
        const allWorkDays = await loadAll();
        const index = allWorkDays.findIndex(workDay => workDay.id === id);
        if (index === -1) return undefined;
        
        const updated = {...allWorkDays[index], ...patch};
        allWorkDays[index] = updated;
        
        await save(allWorkDays);
        return updated;
    } 

    async function clear(): Promise<void> {
        try {
            await AsyncStorage.removeItem(LONG_TERM_STORAGE_KEY);
        } catch (error) {
            console.error('useStorage: clearAll failed', error);
        }
    }

    return {loadAll, save, add, getById, update, clear, getWorkDay}
}

// LIVE TRACKING //
export function liveTracking() {
    async function save(state: ActiveTrackingState): Promise<void> {
        try {
            await AsyncStorage.setItem(TEMP_STORAGE_LIVE_TRACKING_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('useStorage: liveTracking - save failed', error);
        }

    }

    async function load(): Promise<ActiveTrackingState | null> {
        try {
            const stored = await AsyncStorage.getItem(TEMP_STORAGE_LIVE_TRACKING_KEY);
            
            if (!stored) return null;
            return JSON.parse(stored) as ActiveTrackingState;
        } catch (error) {
            console.error('useStorage: liveTracking - load failed', error);
            return null;
        }
    }

    async function clear(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TEMP_STORAGE_LIVE_TRACKING_KEY);
        } catch (error) {
            console.error('useStorage: liveTracking - clear failed', error)
        }
    }

    async function update(patch: Partial<ActiveTrackingState>): Promise<void> { 
        try {
            const stored = await AsyncStorage.getItem(TEMP_STORAGE_LIVE_TRACKING_KEY);
            if (!stored) return;

            const parsed = JSON.parse(stored)
            const updatedActiveTrackingState: ActiveTrackingState = {...parsed, ...patch}
            await save(updatedActiveTrackingState) 
        } catch (error) {
            console.error('useStorage: liveTracking - update failed', error);
        }
    }

    return {save, load, clear, update}
}

// MANUAL ORDER ENTRY //
export function manualOrderEntry() {
    
    async function loadDraft(): Promise<OrderEntryDraft | null> {
        try {
            const stored = await AsyncStorage.getItem(TEMP_STORAGE_ORDER_ENTRY_DRAFT_KEY)
            if (!stored) return null;

            return JSON.parse(stored) as OrderEntryDraft
        } catch (error) {
            console.error('useStorage: manualOrderEntry - loadDraft failed', error)
            return null;
        }
    }

    async function saveDraft(draft: OrderEntryDraft): Promise<void> {
        try {
            await AsyncStorage.setItem(TEMP_STORAGE_ORDER_ENTRY_DRAFT_KEY, JSON.stringify(draft))
        } catch (error) {
            console.error('useStorage: manualOrderEntry - saveDraft failed', error)
        }
    }

    async function clearDraft(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TEMP_STORAGE_ORDER_ENTRY_DRAFT_KEY)
        } catch (error) {
            console.error('useStorage: manualOrderEntry - clearDraft failed', error)
        }
    }

    return { loadDraft, saveDraft, clearDraft }
}