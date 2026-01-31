import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import colors from '@/constants/Colors';
import useOrdersStorage, { StoredOrder } from '@/hooks/useOrdersStorage';

export default function History() {
    const { getOrders } = useOrdersStorage();
    const [orders, setOrders] = useState<StoredOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const data = await getOrders();
            setOrders(data);
            setLoading(false);
        })();
    }, []);

    const renderOrderItem = ({ item }: { item: StoredOrder }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.restaurant}>{item.restaurant}</Text>
                <Text style={styles.service}>{item.service}</Text>
            </View>

            <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{item.date}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pay</Text>
                    <Text style={styles.detailValue}>${item.pay.toFixed(2)}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Miles</Text>
                    <Text style={styles.detailValue}>{item.miles.toFixed(1)}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Saved</Text>
                    <Text style={styles.detailValue}>{new Date(item.savedAt).toLocaleTimeString()}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <View style={styles.centerContent}>
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.centerContent}>
                    <Text style={styles.emptyText}>No orders yet</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    scrollIndicatorInsets={{ bottom: 100 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark,
    },

    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        fontSize: 16,
        color: colors.labelText,
    },

    emptyText: {
        fontSize: 16,
        color: colors.labelText,
    },

    listContent: {
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: 100,
    },

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
        borderBottomColor: '#eee',
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
        gap: 8,
    },

    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    },
});