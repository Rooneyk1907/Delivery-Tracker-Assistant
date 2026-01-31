import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

const STORAGE_KEY = '@order_entry_draft';

export interface OrderEntryDraft {
    selectedService: string;
    tripDate: string;
    tripTime: string;
    tripPay: string;
    tripMiles: string;
    tripRestaurant: string;
    tripDuration: string;
}

export function useOrderEntryStorage() {
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from storage on mount
    async function loadDraft() {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored) as OrderEntryDraft;
        } catch (error) {
            console.log('Failed to load order draft: ', error);
        }

        return null;
    }

    // Save to storage (call this whenever state changes)
    async function saveDraft(draft: OrderEntryDraft) {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        } catch (error) {
            console.log('Failed to save order draft: ', error);
        }
    }

    // Clear storage (call after submitting Order)
    async function clearDraft() {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.log('Failed to clear order draft: ', error);
        }
    }

    return {loadDraft, saveDraft, clearDraft}
}