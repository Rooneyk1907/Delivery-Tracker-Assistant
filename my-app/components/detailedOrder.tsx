import { StoredOrder } from '@/hooks/useOrdersStorage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';



import colors from '@/constants/Colors';

export default function DetailedOrder({visible, item, onPress, handleDelete}: { visible: boolean; item: StoredOrder | null, onPress: () => void, handleDelete: (item: StoredOrder) => void}) {

    // const { removeOrder } = useOrdersStorage();
    
    if (!item) return null;
    
    const editOrder = (id: string) => {
        console.log('edit button pressed. ID: ', id);
    }
    
    
    console.log(item);
    
    // const hh = Math.floor(totalMs / 3600000).toString().padStart(2, '0');
    function formatElapsed(duration: number) {
        
        const mm = Math.floor((duration / 60)).toString().padStart(2, '0');
        const ss = Math.floor((duration) % 60).toString().padStart(2, '0');
        // console.log(mm);
        // console.log(ss);
        return `${mm}:${ss}`;
    
    }

    
   
    
    // function handleDelete(item: StoredOrder) {
    //     // const itemId = item.id

    //     Alert.alert(
    //         'Confirmation',
    //         `Delete Entry: ${item.restaurant}, ${item.date} - ${item.startTime}?`,
    //         [
    //             {
    //                 text: 'Cancel',
    //                 onPress: () => console.log('Cancel pressed'),
    //                 style: 'cancel'
    //             },
    //             {
    //                 text: 'Delete',
    //                 onPress: () => removeOrder(item.id)
    //             },
    //         ],
    //         { cancelable: true}
    //     )
    // }

    return (
        <Modal visible={visible} animationType='slide' style={styles.container}>
            <Text>Detailed Order View</Text>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onPress} >
                        <Ionicons
                            name='arrow-back-outline'
                            size={20}
                            color='#fff'
                            style={{ marginBottom: 4}}
                            />
                    </TouchableOpacity>
                    <Text style={styles.restaurant}>
                        {item.restaurant}
                    </Text>
                    <Text style={styles.service}>{item.service}</Text>
                    <TouchableOpacity onPress={() => editOrder(item.id)}>
                    <Ionicons
                        name='create-outline'
                        size={20}
                        color='#fff'
                        style={{marginBottom: 4}}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)}>
                        <Ionicons 
                            name='trash-outline'
                            size={20}
                            color='#fff'
                            style={{marginBottom: 4}}
                            />
                    </TouchableOpacity>
                </View>
                <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>

                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>{item.date}</Text>
                        <Text style={styles.detailLabel}>Pay</Text>
                        <Text style={styles.detailValue}>$ {(item.pay).toFixed(2)}</Text>
                        <Text style={styles.detailLabel}>Miles</Text>
                        <Text style={styles.detailValue}>{item.miles.toFixed(1)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Duration</Text>
                        <Text style={styles.detailValue}>{item.totalDuration}</Text>
                    </View>
                    <View style={styles.durationSection}>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>To Restaurant</Text>
                            <Text style={styles.detailValue}>{
                                formatElapsed(item.segments.toRestaurant)}</Text>
                            <Text style={styles.detailLabel}>Restaurant Wait</Text>
                            <Text style={styles.detailValue}>{
                                formatElapsed(item.segments.atRestaurant)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>To Customer</Text>
                            <Text style={styles.detailValue}>{
                                formatElapsed(item.segments.toCustomer)}</Text>
                            <Text style={styles.detailLabel}>Deadhead</Text>
                            <Text style={styles.detailValue}>{
                                formatElapsed(item.segments.returnToHotspot)}</Text>
                        </View>
                    </View>
                </View>
                <View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Gross Hourly Pay</Text>
                        <Text style={styles.detailValue}>$ 
                            {(item.grossHourlyPay).toFixed(2)}
                            {/* {calculateGrossHourly(item.pay, item.totalDuration)} */}
                             /hr</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Estimated Net Hourly Pay</Text>
                        <Text style={styles.detailValue}>$ 
                            {(item.netHourlyPay).toFixed(2)}
                            {/* {calculateNetHourly(item.pay, item.miles, item.totalDuration)} */}
                             /hr</Text>
                    </View>
                </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
    },
    header: {
        // flex: 1,
        backgroundColor: colors.dark,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    restaurant: {
        fontSize: 16,
        fontWeight: '700',
        // color: colors.dark,
        // flex: 1,
    },
    service: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    orderDetails: {
        gap: 8,
        // flex: 3,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 3
    },
    detailLabel: {
        fontSize: 12,
        color: colors.labelText,
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    detailValue: {
        fontSize: 12,
        color: colors.dark,
        fontWeight: '600',
    },
    durationSection: {
        paddingVertical: 5
    }
})
