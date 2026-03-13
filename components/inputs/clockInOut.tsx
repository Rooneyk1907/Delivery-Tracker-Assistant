import {View, Text, StyleSheet, TextInput, TouchableOpacity} from 'react-native';

import colors from '@/constants/Colors'

type ClockInOutProps = {
    activeShift: boolean;
    clockInTime: string;
    handleClockIn: any;
    handleClockInText: any;
    clockOutTime: string;
    handleClockOut: any;
    handleClockOutText: any;
}

export default function ClockInout({activeShift, clockInTime, handleClockIn, handleClockInText, clockOutTime, handleClockOut, handleClockOutText}: ClockInOutProps) {
    return (
        <View style={styles.container}>
            <View style={styles.card}>

                <Text>Clock In / Clock Out Component</Text>
                <View style={styles.inputSection}>
                    <Text style={styles.label}>Clock In Time</Text>
                    <TextInput
                        style={styles.input} 
                        value={clockInTime}
                        onChangeText={handleClockInText}
                        placeholder='HH:MM'
                        />
                </View>
                <View style={styles.inputSection}>
                    <Text style={styles.label}>Clock Out Time</Text>
                    <TextInput 
                        style={styles.input}
                        value={clockOutTime}
                        onChangeText={handleClockOutText}
                        placeholder="HH:MM"
                        />
                </View>
                <View style={styles.buttonRow}>
                    {activeShift ? (
                        <TouchableOpacity style={[styles.button, styles.stop]} onPress={handleClockOut}>
                            <Text style={styles.buttonText}>Clock Out</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.button, styles.start]} onPress={handleClockIn}>
                            <Text style={styles.buttonText}>Clock In</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark,
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
    inputSection: {
        marginTop: 12,
    },
    label: {
        fontSize: 10,
        color: colors.labelText,
        marginBottom: 6,
        textTransform: 'uppercase'
    },
    input: {
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        color: colors.dark
    },
    buttonRow: {
        marginTop: 16,
        gap: 12,
        // flexDirection: 'row',
        // maxWidth: '67%',
        // alignContent: 'center',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    start: {
        backgroundColor: colors.success,
    },
    stop: {
        backgroundColor: colors.warning,
    }
})