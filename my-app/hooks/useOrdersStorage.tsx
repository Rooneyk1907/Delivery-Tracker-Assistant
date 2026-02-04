import { ActiveOrder } from '@/types/order';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@completed_orders_v1';

export interface StoredOrder extends ActiveOrder {
    id: string;
    savedAt: string;
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function loadOrders(): Promise<StoredOrder[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as StoredOrder[];
    } catch (error) {
        console.error('useOrdersStorage: loadOrders failed', error);
        return [];
    }
}

async function saveOrders(orders: StoredOrder[]) {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
        console.error('useOrdersStorage: saveOrders failed', error)
    }
}

// export default function useOrdersStorage() {
    async function addOrder(order: ActiveOrder): Promise<StoredOrder> {
        const stored: StoredOrder = {
            ...order,
            id: generateId(),
            savedAt: new Date().toISOString(),
        };
        const all = await loadOrders();
        // prepend newest first
        all.unshift(stored);
        await saveOrders(all);
        return stored;
    }
    

    async function getOrders(): Promise<StoredOrder[]> {
        return await loadOrders();
    }

    async function getOrder(id: string): Promise<StoredOrder | undefined> {
        const all = await loadOrders();
        return all.find((o) => o.id === id);
    }

    async function removeOrder(id: string): Promise<void> {
        const all = await loadOrders();
        const filtered = all.filter((o) => o.id !== id);
        await saveOrders(filtered);
    }

    async function clearAll(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('useOrdersStorage: clearAll failed', error);
        }
    }

    async function updateOrder(id: string, patch: Partial<StoredOrder>): Promise<StoredOrder | undefined> {
        const all = await loadOrders();
        const idx = all.findIndex((o) => o.id === id);
        if (idx === -1) return undefined;
        const updated = { ...all[idx], ...patch };
        all[idx] = updated;
        await saveOrders(all);
        return updated;
    }

export { addOrder, clearAll, getOrder, getOrders, removeOrder, updateOrder };

