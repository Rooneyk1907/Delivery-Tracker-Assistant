import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import Order from '@/types/order';

import { formatOrderTimes } from '@/helpers/orderTimeFormatter';

type OrderCardProps = {
	order: Order;
	onPress: () => void;
};

export default function OrderCard({ order, onPress }: OrderCardProps) {
	const orderTimes = formatOrderTimes(order);

	return (
		<View>
			<Text>OrderCard</Text>
		</View>
	);
}

const styles = StyleSheet.create({});
