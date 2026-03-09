import { Order } from '@/types/order';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useState } from 'react';

import colors from '@/constants/Colors';

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
					<Text>{order.date}</Text>
					<Text>Gross: ${order.pay.gross.toFixed(2)}</Text>
					<Text>Net: ${order.pay.net.toFixed(2)}</Text>
					<View style={styles.buttonRow}>
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
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

{
	/* <Text>{orderTimes.toRestaurant} to Restaurant</Text> */
}
{
	/* <Text>{orderTimes.toCustomer} to Customer</Text> */
}
{
	/* <Text>{orderTimes.atRestaurant} Wait at Restaruarnt</Text> */
}
{
	/* <Text>
					{orderTimes.returnToHotspot} return to hotspot/time before new order
				</Text> */
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
		justifyContent: 'space-between',
		gap: 8,
		marginTop: 6,
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
		fontSize: 12,
		fontWeight: 'bold',
		color: colors.dark,
		marginTop: 2,
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
