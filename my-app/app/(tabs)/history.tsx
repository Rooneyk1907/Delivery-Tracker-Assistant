import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import colors from '@/constants/Colors';
import { getOrders, removeOrder, StoredOrder } from '@/hooks/useOrdersStorage';

import DetailedOrder from '@/components/detailedOrder';
import OrderDisplay from '@/components/orderDisplay';


export default function History() {
    // const { getOrders } = useOrdersStorage();
    const [orders, setOrders] = useState<StoredOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState<StoredOrder | null>(null);
    const [displayDetailedOrder, setDisplayDetailedOrder] = useState(false)

    useFocusEffect(
        useCallback(() => {
        (async () => {
            const data = await getOrders();
            setOrders(data);
            setLoading(false);
        })();
    }, [])
);

    const handleOrderPress = (item: StoredOrder) => {
        console.log('Selected order ID: ', item.id);
        setSelectedOrder(item);
        setDisplayDetailedOrder(true)
    }

    const handleBackButton = () => {
        setDisplayDetailedOrder(false);
    }

    function handleDelete(item: StoredOrder) {
    // const itemId = item.id
        if (Platform.OS === 'web') {
            if (window.confirm(`Delete Entry: ${item.restaurant}, ${item.date} - ${item.startTime}?`)) {

                removeOrder(item.id);
                setDisplayDetailedOrder(false);
                
                const filteredOrders = orders.filter(order => order.id !== item.id)
                setOrders(filteredOrders);
            } 

        } else {
        Alert.alert(
            'Confirmation',
            `Delete Entry: ${item.restaurant}, ${item.date} - ${item.startTime}?`,
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel pressed'),
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    onPress: () => {
                        removeOrder(item.id);
                        setDisplayDetailedOrder(false);

                        const filteredOrders = orders.filter(order => order.id !== item.id)
                        setOrders(filteredOrders);
                    }
                }
            ],
            { cancelable: true}
        
        )}
   
}

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
                ) : <>
                <FlatList
                    data={orders}
                    renderItem={({ item }) => (
                        <OrderDisplay
                            item={item}
                            onPress={() => handleOrderPress(item)}
                            />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    scrollIndicatorInsets={{ bottom: 100 }}
                    />

                <DetailedOrder
                    visible={displayDetailedOrder}
                    item={selectedOrder}
                    onPress={handleBackButton}
                    handleDelete={handleDelete}
                    />

                    </>
                }
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

   },

);