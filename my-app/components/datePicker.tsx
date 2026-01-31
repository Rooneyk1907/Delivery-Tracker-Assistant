import colors from '@/constants/Colors';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
    value: Date;
    onChange: (d: Date) => void;
    mode?: 'date' | 'time';
    label?: string;
};

export default function DatePicker({ value, onChange, mode = 'date', label }: Props) {
    const [show, setShow] = useState(false);
    const [displayValue, setDisplayValue] = useState(formatDisplay(value, mode))

    useEffect(() => {
        setDisplayValue(formatDisplay(value, mode))
    }, [value, mode])

    const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS === 'android') setShow(false);
        if (selected) onChange(selected);
    };

    function handleWebBlur() {
        if (mode === 'date') {

            const parsed = new Date(displayValue);
            if (!isNaN(parsed.getTime())) {
                onChange(parsed);
            } else {
                setDisplayValue(formatDisplay(value, mode));
            }
        } else if (mode === 'time') {
            const [hours, minutes] = displayValue.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)){
                const updated = new Date(value);
                updated.setHours(hours, minutes, 0);
                onChange(updated);
            } else {
                setDisplayValue(formatDisplay(value, mode))
            }
        }
    }

    const displayText = formatDisplay(value, mode);

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                {label ? <Text style={styles.label}>{label}</Text> : null}
                <TextInput
                    style={[styles.button, styles.webInput]}
                    value={displayValue}
                    onChangeText={setDisplayValue}
                    onBlur={handleWebBlur}
                    placeholder={mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM'}
                    />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={() => setShow(true)}>
                {label ? <Text style={styles.label}>{label}</Text> : null }
                <Text style={styles.value}>{displayText}</Text>
            </TouchableOpacity>

            {show && Platform.OS === 'android' && (
                <DateTimePicker
                    value={value}
                    mode={mode}
                    display="default"
                    onChange={handleChange}
                    />
            )}

            {show && Platform.OS === 'ios' && (
                <Modal transparent animationType="fade" onRequestClose={() => setShow(false)}>
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalContent}>
                            <DateTimePicker
                                value={value}
                                mode={mode}
                                display="spinner"
                                onChange={(e, d) => {
                                    if (d) onChange(d);
                                }}
                                style={{ width: '100%' }}
                                />
                                <TouchableOpacity style={styles.doneButton} onPress={()=>setShow(false)}>
                                    <Text style={styles.doneText}>Done</Text>
                                </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    )

}

function formatDisplay(d: Date, mode: 'date' | 'time') {
    if(!(d instanceof Date) || isNaN(d.getTime())) return '';
    return mode === 'date'
        ? d.toISOString().slice(0, 10)
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    button: {
        padding: 10,
        borderRadius:8,
        borderColor: '#ddd',
        borderWidth: 1,
        backgroundColor: '#fff',
    },
    webInput: {
        paddingVertical: 8,
        paddingHorizontal: 10
    },
    label: {
        fontSize: 10,
        color: colors.labelText,
        textTransform: 'uppercase'
    },
    value: {
        fontSize: 14,
        color: colors.dark
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.35)'
    },
    modalContent: {
        backgroundColor: '#ddd',
        padding: 12,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    doneButton: {
        marginTop: 8,
        alignSelf: 'flex-end',
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: colors.primary,
        borderRadius: 8
    },
    doneText: {
        color: '#fff',
        fontWeight: '700'
    }
})