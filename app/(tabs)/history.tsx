import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useState, useEffect, useMemo } from 'react';

import { workDay } from '@/hooks/useStorage';

import colors from '@/constants/Colors';

import { WorkDay } from '@/types/workday';
import { Order } from '@/types/order';

import SummaryCard from '@/components/history/summaryCard';
import OrderCard from '@/components/history/orderCard';
import DetailedHistoryCard from '@/components/history/detailedHistoryCard';

type FilterOption = {
	id: 'today' | 'prev7days' | 'thisMonth' | 'prevMonthRolling' | 'all';
	value: string;
};
const filterOptions: FilterOption[] = [
	{
		value: 'All',
		id: 'all',
	},
	{
		value: 'Today',
		id: 'today',
	},
	{
		value: 'Previous 7 Days',
		id: 'prev7days',
	},
	{
		value: 'This Month',
		id: 'thisMonth',
	},
	{
		value: 'Previous Month',
		id: 'prevMonthRolling',
	},
];

const toDateOnly = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());
const toISODate = (date: Date) => toDateOnly(date).toISOString().slice(0, 10);

const buildDateArrayFromFilter = (
	filterId: FilterOption['id'] | null,
	now: Date = new Date(),
): string[] => {
	if (!filterId || filterId === 'all') return [];

	const today = toDateOnly(now);

	switch (filterId) {
		case 'today': {
			return [toISODate(today)];
		}

		case 'prev7days': {
			// excludes today
			return Array.from({ length: 7 }, (_, i) => {
				const d = new Date(today);
				d.setDate(today.getDate() - (7 - i));
				return toISODate(d);
			});
		}

		case 'thisMonth': {
			const start = new Date(today.getFullYear(), today.getMonth(), 1);
			const totalDays = today.getDate();
			return Array.from({ length: totalDays }, (_, i) => {
				const d = new Date(start);
				d.setDate(start.getDate() + i);
				return toISODate(d);
			});
		}

		case 'prevMonthRolling': {
			// previous 30 days, excluding today
			return Array.from({ length: 30 }, (_, i) => {
				const d = new Date(today);
				d.setDate(today.getDate() - (30 - i));
				return toISODate(d);
			});
		}

		default:
			return [];
	}
};

export default function History() {
	const dayStore = workDay();
	const { loadAll } = dayStore;

	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [workDays, setWorkDays] = useState<WorkDay[]>([]);

	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
	const [selectedFilterId, setSelectedFilterId] = useState<
		FilterOption['id'] | null
	>(null);

	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

	const selectedFilterLabel =
		filterOptions.find((f) => f.id === selectedFilterId)?.value ??
		'Select a Filter';

	useEffect(() => {
		(async () => {
			const loadedWorkDays = await loadAll();

			if (loadedWorkDays != null) setWorkDays(loadedWorkDays);
			setIsLoading(false);
		})();
	}, [loadAll]);

	const filteredWorkDays = useMemo(() => {
		if (!workDays.length) return [];
		if (!selectedFilterId) return []; // nothing selected => show nothing
		if (selectedFilterId === 'all') return workDays; // all selected => show all

		const filteredDates = buildDateArrayFromFilter(selectedFilterId);

		const dateSet = new Set(filteredDates);
		return workDays?.filter((day) => dateSet.has(day.date));
	}, [workDays, selectedFilterId]);

	const filteredOrders = useMemo(
		() => filteredWorkDays?.flatMap((day) => day.orders ?? []),
		[filteredWorkDays],
	);

	const hasSelectedFilter = selectedFilterId !== null;

	console.log(filteredOrders);

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView>
				<View style={styles.container}>
					<Text style={styles.heading}>History</Text>
					{isLoading ? (
						<Text>Loading...</Text>
					) : (
						<View>
							<View style={styles.card}>
								<Text>Date Selection</Text>

								<TouchableOpacity
									style={styles.dropdownButton}
									onPress={() => setIsDropdownOpen((prev) => !prev)}
									activeOpacity={0.8}>
									<Text style={styles.dropdownButtonText}>
										{selectedFilterLabel}
									</Text>
									<Text style={styles.dropdownChevron}>
										{isDropdownOpen ? '▲' : '▼'}
									</Text>
								</TouchableOpacity>

								{isDropdownOpen && (
									<View style={styles.dropdownList}>
										<FlatList
											data={filterOptions}
											keyExtractor={(item) => item.id}
											renderItem={({ item }) => (
												<TouchableOpacity
													style={styles.dropdownItem}
													onPress={() => {
														setSelectedFilterId(item.id);
														setIsDropdownOpen(false);
													}}>
													<Text style={styles.dropdownItemText}>
														{item.value}
													</Text>
												</TouchableOpacity>
											)}
										/>
									</View>
								)}
							</View>
							{hasSelectedFilter && (
								<>
									{filteredWorkDays && (
										<View style={styles.card}>
											<Text style={styles.subHeading}>Summary</Text>
											<SummaryCard
												workDays={filteredWorkDays}
												orders={filteredOrders}
											/>
										</View>
									)}
									<View style={styles.card}>
										<Text style={styles.subHeading}>Orders</Text>
										<FlatList
											style={{ minWidth: '100%' }}
											data={filteredOrders}
											keyExtractor={(item) => `${item.date}-${item.id}`}
											renderItem={({ item }) => (
												<OrderCard
													order={item}
													onPress={() => setSelectedOrder(item)}
												/>
											)}
											ListEmptyComponent={
												<Text>No orders found for selected filter.</Text>
											}
										/>
									</View>
								</>
							)}
						</View>
					)}
				</View>

				{/* Detailed history shows when clicked */}
				<DetailedHistoryCard
					visible={selectedOrder !== null}
					order={selectedOrder}
					onClose={() => setSelectedOrder(null)}
				/>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.dark,
	},
	container: {
		backgroundColor: '#eee',
		padding: 15,
		paddingTop: 10,
		borderWidth: 2,
		borderColor: '#eee',
		borderRadius: 12,
		margin: 15,
	},
	sectionHeading: {
		fontSize: 17,
		fontWeight: '800',
		color: colors.labelText,
		textTransform: 'uppercase',
	},
	heading: {
		alignSelf: 'center',
		color: colors.labelText,
		fontWeight: '800',
		fontSize: 45,
		textTransform: 'uppercase',
		marginBottom: 16,
	},
	subHeading: {
		alignSelf: 'center',
		color: colors.labelText,
		fontWeight: '800',
		fontSize: 32,
		textTransform: 'uppercase',
		marginBottom: 14,
	},
	card: {
		// minWidth: '100%',
		backgroundColor: '#f8f9fa',
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#eee',
		alignItems: 'center',
		marginTop: 12,
		marginBottom: 12,
	},
	dropdownButton: {
		width: '100%',
		marginTop: 8,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: '#d9d9d9',
		borderRadius: 8,
		backgroundColor: '#fff',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	dropdownButtonText: {
		color: colors.dark,
		fontWeight: '600',
	},
	dropdownChevron: {
		color: colors.labelText,
		fontSize: 12,
	},
	dropdownList: {
		width: '100%',
		marginTop: 8,
		borderWidth: 1,
		borderColor: '#d9d9d9',
		borderRadius: 8,
		backgroundColor: '#fff',
		maxHeight: 180,
	},
	dropdownItem: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
	},
	dropdownItemText: {
		color: colors.dark,
	},
	orderInfo: {
		flex: 1,
		minWidth: 0,
	},
	statDisplay: {
		fontSize: 14,
		fontWeight: 'bold',
		color: colors.dark,
		marginTop: 4,
	},
	label: {
		fontSize: 9,
		color: colors.labelText,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	mainStats: {
		flexDirection: 'column',
		backgroundColor: '#f8f9fa',
		padding: 10,
		borderWidth: 1,
		borderColor: '#eee',
		borderRadius: 12,
		alignItems: 'center',
		marginBottom: 12,
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
});
