 
import { StoredOrder } from '@/hooks/useOrdersStorage';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import colors from '@/constants/Colors';

export default function orderDisplay({ item, onPress }: { item: StoredOrder; onPress: () => void}) {



    return (
        <TouchableOpacity onPress={onPress}>
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <Text style={styles.restaurant}>{item.restaurant}</Text>
                    <Text style={styles.service}>{item.service}</Text>
                </View>
                <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>
                            {item.date}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                            Pay
                        </Text>
                        <Text style={styles.detailValue}>
                        $ {item.pay.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                            Miles
                        </Text>
                        <Text style={styles.detailValue}>
                        {item.miles.toFixed(1)} mi
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                            Duration
                        </Text>
                        <Text style={styles.detailValue}>
                        {item.totalDuration}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )

}

const styles = StyleSheet.create({
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    restaurant: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.dark,
        flex: 1,
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
        gap: 8
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    detailLabel: {
        fontSize: 12,
        color: colors.labelText,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 12,
        color: colors.dark,
        fontWeight: '600',
    }
})