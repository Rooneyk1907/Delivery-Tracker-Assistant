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
				<Text
					style={styles.serviceText}
					numberOfLines={1}
					ellipsizeMode='tail'>
					{order.service}
				</Text>
			</View>

			{/* Row 2: Pay */}
			<View style={styles.sectionRow}>
				<Text style={styles.sectionHeading}>Pay</Text>
				<View style={styles.statsRow}>
					<View style={styles.subStatBox}>
						<Text style={styles.label}>Gross Pay</Text>
						<Text style={[styles.subStatDisplay, styles.grossPay]}>
							${order.pay.gross.toFixed(2)}
						</Text>
					</View>
					<View style={styles.subStatBox}>
						<Text style={styles.label}>Net Pay</Text>
						<Text style={[styles.subStatDisplay, styles.grossPay]}>
							${order.pay.grossHourly.toFixed(2)}/hr
						</Text>
					</View>
					<View style={styles.subStatBox}>
						<Text style={styles.label}>Net Pay</Text>
						<Text style={[styles.subStatDisplay, styles.netPay]}>
							${order.pay.net.toFixed(2)}
						</Text>
					</View>
					<View style={styles.subStatBox}>
						<Text style={styles.label}>Hourly Net</Text>
						<Text style={[styles.subStatDisplay, styles.netPay]}>
							${order.pay.netHourly.toFixed(2)}/hr
						</Text>
					</View>
				</View>
			</View>

			{/* Row 3: Times */}
			<View style={styles.sectionRow}>
				<Text style={styles.sectionHeading}>Times</Text>
				<View style={styles.statsRow}>
					<View style={styles.subStatBox}>
						<Text style={styles.label}>Total Time</Text>
						<Text style={styles.subStatDisplay}>
							{orderTimes.totalDuration}
						</Text>
					</View>
					<View style={styles.subStatBox}>
						<Text style={styles.label}>Travel Time</Text>
						<Text
							style={[
								styles.subStatDisplay,
								{
									color: colorPicker(orderTimes.percentages.totalTravel),
								},
							]}>
							{orderTimes.totalTravel}
						</Text>
					</View>
					<View style={styles.subStatBox}>
						<Text style={styles.label}>Wait Time</Text>
						<Text
							style={[
								styles.subStatDisplay,
								{ color: colorPicker(orderTimes.percentages.totalWait) },
							]}>
							{orderTimes.totalWait}
						</Text>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	orderCard: {
		flexDirection: 'column',
		alignItems: 'stretch',
		backgroundColor: colors.background1,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		padding: 12,
		marginBottom: 10,
		gap: 10,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 12,
	},
	restaurantText: {
		flex: 1,
		minWidth: 0,
		fontSize: 16,
		fontWeight: '700',
		color: colors.dark,
		textTransform: 'uppercase',
	},
	serviceText: {
		flexShrink: 0,
		fontSize: 13,
		fontWeight: '600',
		color: colors.labelText,
		textTransform: 'uppercase',
	},
	sectionRow: {
		width: '100%',
	},
	sectionHeading: {
		fontSize: 17,
		fontWeight: '800',
		color: colors.labelText,
		textTransform: 'uppercase',
	},
	statsRow: {
		flexDirection: 'row',
		flexWrap: 'nowrap',
		justifyContent: 'space-between',
		gap: 8,
		marginTop: 6,
	},
	subStatBox: {
		flex: 1,
		flexBasis: 0,
		minWidth: 0,
		backgroundColor: colors.background2,
		padding: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: 'center',
		justifyContent: 'center',
		margin: 0,
	},
	subStatDisplay: {
		fontSize: 12,
		fontWeight: 'bold',
		color: colors.dark,
		marginTop: 2,
	},
	label: {
		fontSize: 9,
		color: colors.labelText,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	grossPay: {
		fontSize: 14,
		color: colors.labelText,
	},
	netPay: {
		fontSize: 14,
		fontWeight: '800',
		color: colors.net,
		margin: 0,
	},
});
