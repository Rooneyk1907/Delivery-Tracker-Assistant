import { Order } from '@/types/order';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

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
					<Text style={styles.restaurant}>{order.restaurant}</Text>
					<Text>{order.service}</Text>
					<Text>{order.date}</Text>
					<Text>Gross: ${order.pay.gross.toFixed(2)}</Text>
					<Text>Net: ${order.pay.net.toFixed(2)}</Text>
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
	restaurant: {
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 8,
	},
});
