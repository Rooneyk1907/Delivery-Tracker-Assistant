/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import CurrencyInput from '@/components/currencyInput';
import DatePicker from '@/components/datePicker';
import MileageInput from '@/components/mileageInput';
import colors from '@/constants/Colors';

import { useOrderEntryStorage } from '@/hooks/useOrderEntryStorage';
import { addOrder } from '@/hooks/useOrdersStorage';
import { ActiveOrder } from '@/types/order';

const SERVICES = ['GrubHub', 'DoorDash', 'UberEats'];

export default function OrderEntry() {
    const { loadDraft, saveDraft, clearDraft } = useOrderEntryStorage();
    // const { addOrder } = useOrdersStorage();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedService, setSelectedService] = useState('GrubHub');

    const now = new Date()

    const [tripDate, setTripDate] = useState<Date>(now);
    const [tripTime, setTripTime] = useState<Date>(now);
    const [tripPay, setTripPay] = useState('');
    const [tripMiles, setTripMiles] = useState('');
    const [tripRestaurant, onChangeText] = useState('');
    const [tripDuration, setTripDuration] = useState('');


    // Load draft on mount
    useEffect(() => {
        (async () => {
            const draft = await loadDraft();
            if(draft) {
                setSelectedService(draft.selectedService);
                setTripDate(new Date(draft.tripDate));
                setTripTime(new Date(draft.tripTime));
                setTripPay(draft.tripPay);
                setTripMiles(draft.tripMiles);
                onChangeText(draft.tripRestaurant);
                setTripDuration(draft.tripDuration);
            }
        }) ();
    }, [clearDraft]);

    // Save to Storage whenever state changes
    useEffect(() => {
        saveDraft({
            selectedService,
            tripDate: tripDate.toISOString(),
            tripTime: tripTime.toISOString(),
            tripPay,
            tripMiles,
            tripRestaurant,
            tripDuration,
        });
    }, [selectedService, tripDate, tripTime, tripPay, tripMiles, tripRestaurant, tripDuration])

    function formatTime(d: Date) {
        return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    }

    

    async function handleSaveOrder() {
        const pay = parseFloat(tripPay)
        const miles = parseFloat(tripMiles)
        const [ minutes, seconds] = tripDuration.split(':').map(Number)
        const totalDuration =  (minutes / 60) + (seconds / 360);

        const estNetPay = pay - (miles * 0.67)

        const grossHourlyPay = pay / totalDuration;
        const netHourlyPay = estNetPay / totalDuration;

        const order: ActiveOrder = {
            date: tripDate.toISOString().slice(0, 10),
            service: selectedService as 'GrubHub' | 'DoorDash' | 'UberEats',
            restaurant: tripRestaurant,
            pay: pay || 0,
            miles: miles || 0,
            startTime: formatTime(tripTime),
            restArrivalTime: '',
            restDepartureTime: '',
            deliveryTime: '',
            segments: {
                toRestaurant: 0,
                atRestaurant: 0,
                toCustomer: 0,
                returnToHotspot: 0,
            },
            totalDuration: tripDuration,
            grossHourlyPay: grossHourlyPay,
            netHourlyPay: netHourlyPay,
        };

        try {
            addOrder(order);
            clearDraft();
            setTripDate(now);
            setTripTime(now);
            setTripPay('');
            setTripMiles('');
            onChangeText('');
            setTripDuration('')
        } catch (error) {
            console.error('Failed to save order', error);
        }
    }

    return(
        <View id='order-entry-wrapper' style={styles.card}>
            <Text style={styles.cardTitle}>Order Entry</Text>

            <View style={[styles.inputSection, {flexDirection: 'row', justifyContent: 'space-between'}]}>

                <DatePicker 
                    value={tripDate}
                    onChange={setTripDate}
                    mode="date"
                    label="Trip Date (include dashes)"
                    />
                <DatePicker
                    value={tripTime}
                    onChange={setTripTime}
                    mode='time'
                    label="Trip Time (24-hour)"
                    />
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.label}>Service</Text>
            
                <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setDropdownOpen(!dropdownOpen)}
                >
                    <Text style={styles.dropdownText}>{selectedService}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>

                {dropdownOpen && (
                    <View style={styles.dropdownMenu}>
                        {SERVICES.map((service) => (
                            <TouchableOpacity
                                key={service}
                                style={styles.option}
                                onPress={() => {
                                    setSelectedService(service);
                                    setDropdownOpen(false);
                                }}
                                >
                                    <Text style={styles.optionText}>{service}</Text>
                                </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
            
            <CurrencyInput
                label="Pay ($)"
                value={tripPay}
                onChangeText={setTripPay}
           />
           
           <MileageInput 
                label="Miles"
                value={tripMiles}
                onChangeText={setTripMiles}
           />
           
           <View style={styles.inputSection}>
            <Text style={styles.label}>Restaurant</Text>
            <TextInput 
                style={styles.input}
                value={tripRestaurant}
                onChangeText={onChangeText}
                placeholder='Restaurant' 
                />

           </View>
           <View style={styles.inputSection}>
                <Text style={styles.label}>Trip Duration (HH:MM)</Text>
                <TextInput
                    style={styles.input}
                    value={tripDuration}
                    onChangeText={(text) => {
                        const filtered = text.replace(/[^0-9:]/g, '');
                        const parts = filtered.split(':');
                        if (parts.length > 2) return; // Max one colon

                        let formatted = filtered;
                        if (parts[0]?.length > 2) parts[0] = parts[0].slice(0,2);
                        if (parts[1]?.length > 2) parts[1] = parts[1].slice(0,2);
                        formatted = parts.join(':');
                        
                        setTripDuration(formatted);
                    }}
                    placeholder="HH:MM"
                    
                    />
           </View>

           <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveOrder}>
                    <Text style={styles.saveText}>Save Order</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={ clearDraft }>
                    <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
           </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 19,
        borderRadius: 16,
        marginTop: 15,
        marginBottom: 15,
        elevation: 9,
        width: '100%',
        maxWidth: 460
    },

    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.dark,
        marginBottom: 12,
        paddingHorizontal: 10
    },

    inputSection: {
        marginBottom:12,
        paddingHorizontal: 10,
    },

        input: {
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        color: colors.dark,
    },

    label: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.labelText,
        marginBottom: 0,
        textTransform: 'uppercase',
    },

    dropdown: {
        flexDirection:'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff'
    },

    dropdownText: {
        fontSize: 14,
        color: colors.dark,
        fontWeight: '500',
    },

    dropdownArrow: {
        fontSize: 12,
        color: colors.labelText,
    },

    dropdownMenu: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginTop: 4,
        backgroundColor: '#fff',
    },

    option: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    optionText: {
        fontSize: 14,
        color: colors.dark,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        paddingHorizontal: 10
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    saveButton: {
        backgroundColor: colors.success,
    },
    saveText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase'
    },
    clearButton: {
        backgroundColor: colors.warning
    },
    clearText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
        textTransform: 'uppercase'
    },
})