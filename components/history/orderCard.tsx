import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import colors from '@/constants/Colors';

import Order from '@/types/order';

import { formatOrderTimes } from '@/helpers/orderTimeFormatter';

type OrderCardProps = {
	order: Order;
	onPress: () => void;
};

export default function OrderCard({ order, onPress }: OrderCardProps) {
	const orderTimes = formatOrderTimes(order);

	function colorPicker(orderTime: number) {
		if (orderTime >= 0.75) return colors.error;
		else if (orderTime >= 0.5) return colors.warning;
		else return colors.success;
	}

	return (
		<TouchableOpacity
			style={styles.orderCard}
			activeOpacity={0.85}
			onPress={onPress}>
			{/* Row 1: Restaurant in top left / service in top right */}
			<View style={styles.headerRow}>
				<Text
					style={styles.restaurantText}
					numberOfLines={1}
					ellipsizeMode='tail'>
					{order.restaurant}
				</Text>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	orderCard: {
		flexDirection: 'column',
		alignItems: 'stretch',
		backgroundColor: colors.background1,
	},
});
