import Order from '@/types/order';
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
			<Pressable>
				<Pressable>
					<Text>{order.restaurant}</Text>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
