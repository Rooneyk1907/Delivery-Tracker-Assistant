import { Order } from '@/types/order';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useState } from 'react';

import colors from '@/constants/Colors';

import { formatOrderTimes } from '@/helpers/orderTimeFormatter';

type DetailedHistoryCardProps = {
	visible: boolean;
	order: Order | null;
	onClose: () => void;
};

export default function DetailedHistoryCard({
	visible,
	order,
	onClose,
}: DetailedHistoryCardProps) {
	if (!order) return null;

	const [inEditMode, setInEditMode] = useState<boolean>(false);

	const orderTimes = formatOrderTimes(order);

	function handleEditPress() {
		setInEditMode(true);
	}

	function handleClosePress() {
		if (inEditMode) {
			// confirm exit without saving

			setInEditMode(false);
		}

		onClose();
	}

	function handleSavePress() {
		// save new inputs then close

		onClose();
	}

	// TODO: create color picker function that takes into account mileage
	function colorPicker(order: Order) {}

	return (
		<Modal
			visible={visible}
			transparent
			animationType='fade'
			onRequestClose={onClose}>
			<Pressable
				style={styles.backdrop}
				onPress={onClose}>
				<Pressable
					style={styles.card}
					onPress={() => {}}>
					<View style={styles.headerRow}>
						<Text style={styles.restaurantText}>{order.restaurant}</Text>
						<Text style={styles.serviceText}>{order.service}</Text>
					</View>
					<View style={styles.headerRow}>
						<Text style={styles.label}>
							{order.date} | {order.timestamps.startTime} -{' '}
							{order.timestamps.endDeadheadTime} | {orderTimes.totalDuration}
						</Text>
					</View>
					<Text style={styles.sectionHeading}>Pay</Text>
					<View style={styles.statsRow}>
						<View style={styles.statsRow}>
							<Text style={styles.label}>Gross: </Text>
							<Text style={[styles.subStatDisplay, styles.grossPay]}>
								${order.pay.gross.toFixed(2)}
							</Text>
						</View>
						<View style={styles.statsRow}>
							<Text style={styles.label}>Net: </Text>
							<Text style={[styles.subStatDisplay, styles.netPay]}>
								${order.pay.net.toFixed(2)}
							</Text>
						</View>
					</View>
					<View style={styles.statsRow}>
						<View style={styles.statsRow}>
							<Text style={styles.label}>Hourly Gross</Text>
							<Text style={[styles.subStatDisplay, styles.grossPay]}>
								${order.pay.grossHourly.toFixed(2)} /hr
							</Text>
						</View>
						<View style={styles.statsRow}>
							<Text style={styles.label}>Hourly Net</Text>
							<Text style={[styles.subStatDisplay, styles.netPay]}>
								${order.pay.netHourly.toFixed(2)} /hr
							</Text>
						</View>
					</View>
					<Text style={styles.sectionHeading}>Times</Text>
					<View style={styles.statsRow}>
						<View style={styles.statsRow}>
							<Text style={styles.label}>to Restaurant</Text>
							<Text style={styles.subStatDisplay}>
								{orderTimes.toRestaurant}
							</Text>
						</View>
						<View style={styles.statsRow}>
							<Text style={styles.label}>at Restaurant</Text>
							<Text style={styles.subStatDisplay}>
								{orderTimes.atRestaurant}
							</Text>
						</View>
					</View>
					<View style={styles.statsRow}>
						<View style={styles.statsRow}>
							<Text style={styles.label}>to Customer</Text>
							<Text style={styles.subStatDisplay}>{orderTimes.toCustomer}</Text>
						</View>
						<View style={styles.statsRow}>
							<Text style={styles.label}>To Hotspot</Text>
							<Text style={styles.subStatDisplay}>
								{orderTimes.returnToHotspot}
							</Text>
						</View>
					</View>
					<Text style={styles.sectionHeading}></Text>
					<View style={styles.statsRow}>
						<View style={styles.statsRow}>
							<Text style={styles.label}>Total Travel</Text>
							<Text style={styles.subStatDisplay}>
								{orderTimes.totalTravel}
							</Text>
						</View>
						<View style={styles.statsRow}>
							<Text style={styles.label}>Total Wait</Text>
							<Text style={styles.subStatDisplay}>{orderTimes.totalWait}</Text>
						</View>
					</View>
					<View style={styles.statsRow}>
						<View style={styles.statsRow}>
							<Text style={styles.label}>Total Time</Text>
							<Text style={styles.subStatDisplay}>
								{orderTimes.totalDuration}
							</Text>
						</View>
					</View>
					{/* <View style={styles.buttonRow}>
						{!inEditMode && (
							<Pressable
								style={styles.editButton}
								onPress={handleEditPress}>
								<Text style={styles.editButtonText}>Edit</Text>
							</Pressable>
						)}
						<Pressable
							style={styles.editButton}
							onPress={handleClosePress}>
							<Text style={styles.editButtonText}>Close</Text>
						</Pressable>
						{inEditMode && (
							<Pressable
								style={styles.saveButton}
								onPress={handleSavePress}>
								<Text style={styles.saveButtonText}>Save</Text>
							</Pressable>
						)}
					</View> */}
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.45)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	card: {
		width: '100%',
		maxWidth: 420,
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
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
		marginBottom: 8,
	},
	serviceText: {
		flexShrink: 0,
		fontSize: 13,
		fontWeight: '600',
		color: colors.labelText,
		textTransform: 'uppercase',
	},
	sectionHeading: {
		fontSize: 17,
		fontWeight: '800',
		color: colors.dark,
		textTransform: 'uppercase',
		marginTop: 7,
		borderTopWidth: 2,
		borderTopColor: colors.border,
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
	subStats: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		gap: 8,
	},
	statsRow: {
		flexDirection: 'row',
		flexWrap: 'nowrap',
		justifyContent: 'space-around',
		gap: 8,
		marginTop: 6,
	},
	label: {
		fontSize: 14,
		color: colors.labelText,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	subStatBox: {
		flex: 1,
		flexBasis: 0,
		minWidth: 0,
		backgroundColor: '#f8f9fa',
		padding: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#eee',
		alignItems: 'center',
		justifyContent: 'center',
		margin: 0,
	},
	subStatDisplay: {
		fontSize: 14,
		fontWeight: 'bold',
		color: colors.dark,
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		paddingVertical: 12,
		marginVertical: 6,
	},
	editButton: {
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.warning,
		backgroundColor: colors.warning,
		padding: 12,
		paddingHorizontal: 23,
	},
	editButtonText: {
		color: '#fff',
		textTransform: 'uppercase',
		fontWeight: 'bold',
		fontSize: 15,
	},
	saveButton: {
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.success,
		backgroundColor: colors.success,
		padding: 12,
		paddingHorizontal: 20,
	},
	saveButtonText: {
		color: '#fff',
		textTransform: 'uppercase',
		fontWeight: 'bold',
		fontSize: 15,
	},
});
