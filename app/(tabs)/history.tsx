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

import { DashboardMetrics } from '@/types/dashboardmetrics';
import { WorkDay } from '@/types/workday';
import Order from '@/types/order';
import { formatOrderTimes } from '@/helpers/orderTimeFormatter';
import {
	calculateDashboardMetrics,
	parseDurationToSeconds,
} from '@/helpers/helper';

type OrderCardProps = {
	order: Order;
	onPress: () => void;
};

const OrderCard = ({ order, onPress }: OrderCardProps) => {
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
			onPress={() => console.log('pressed orderId:', order.id)}>
			{/* Row 1: restaurant top left / service top right */}
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
						<Text style={styles.label}>Hourly Gross</Text>
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
				{/* Move to Detail card */}
				{/* <Text>{orderTimes.toRestaurant} to Restaurant</Text> */}
				{/* <Text>{orderTimes.toCustomer} to Customer</Text> */}
				{/* <Text>{orderTimes.atRestaurant} Wait at Restaruarnt</Text> */}
				{/* <Text>
					{orderTimes.returnToHotspot} return to hotspot/time before new order
				</Text> */}
			</View>
		</TouchableOpacity>
	);
};

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
	const { loadAll, getWorkDay } = dayStore;

	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [workDays, setWorkDays] = useState<WorkDay[]>([]);
	const [orders, setOrders] = useState<Order[]>([]);

	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
	const [selectedFilterId, setSelectedFilterId] = useState<
		FilterOption['id'] | null
	>(null);

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

	const SummaryCard = () => {
		const calculatedMetrics = calculateDashboardMetrics(filteredWorkDays);

		function idleColorPicker(
			calculatedMetrics: DashboardMetrics,
			type: string,
		) {
			const idleTime = parseDurationToSeconds(calculatedMetrics.totalIdleTime);
			const activeTime = parseDurationToSeconds(
				calculatedMetrics.totalActiveTime,
			);
			const totalTime = parseDurationToSeconds(calculatedMetrics.totalTime);

			const idlePercentage = idleTime / totalTime;
			const activePercentage = activeTime / totalTime;

			switch (type) {
				case 'idle': {
					if (idlePercentage > 0.25) return colors.warning;
					else if (Number.isNaN(idlePercentage)) return colors.dark;
					else return colors.success;
				}
				case 'active': {
					if (activePercentage > 0.5) return colors.success;
					else if (Number.isNaN(activePercentage)) return colors.dark;
					else return colors.warning;
				}

				default:
					return colors.dark;
			}
		}

		return (
			<View style={{ minWidth: '100%' }}>
				<Text style={styles.subHeading}>Summary</Text>
				<View style={styles.statsRow}>
					<View style={styles.subStatBox}>
						<Text>Worked Days: </Text>
						<Text style={styles.statDisplay}>{filteredWorkDays.length}</Text>
					</View>
					<View style={styles.subStatBox}>
						<Text>Orders: </Text>
						<Text style={styles.statDisplay}>{filteredOrders.length}</Text>
					</View>
				</View>
				<View>
					<Text style={styles.sectionHeading}>Pay</Text>
					<View style={styles.statsRow}>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Gross Pay</Text>
							<Text style={[styles.subStatDisplay, styles.grossPay]}>
								${calculatedMetrics.totalGross.toFixed(2)}
							</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Total Mileage</Text>
							<Text style={styles.subStatDisplay}>
								{calculatedMetrics.totalMiles.toFixed(1)} miles
							</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Net Pay</Text>
							<Text style={[styles.subStatDisplay, styles.netPay]}>
								${calculatedMetrics.totalNet.toFixed(2)}
							</Text>
						</View>
					</View>
					<View style={styles.statsRow}>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Overall Hourly Gross</Text>
							<Text style={[styles.subStatDisplay, styles.grossPay]}>
								$
								{Number.isNaN(calculatedMetrics.totalOverallHourlyGross)
									? '0.00'
									: calculatedMetrics.totalOverallHourlyGross.toFixed(2)}
								/hr
							</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Overall Hourly Net</Text>
							<Text style={[styles.subStatDisplay, styles.netPay]}>
								$
								{Number.isNaN(calculatedMetrics.totalOverallHourlyNet)
									? '0.00'
									: calculatedMetrics.totalOverallHourlyNet.toFixed(2)}
								/hr
							</Text>
						</View>
					</View>
				</View>
				<View>
					<Text style={styles.sectionHeading}>Time</Text>
					<View style={styles.statsRow}>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Total Active Time</Text>
							<Text
								style={[
									styles.subStatDisplay,
									{
										color: idleColorPicker(calculatedMetrics, 'active'),
									},
								]}>
								{calculatedMetrics.totalActiveTime}
							</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Total Idle Time</Text>
							<Text
								style={[
									styles.subStatDisplay,
									{ color: idleColorPicker(calculatedMetrics, 'idle') },
								]}>
								{calculatedMetrics.totalIdleTime}
							</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Total Overall Time</Text>
							<Text
								style={[
									styles.subStatDisplay,
									{
										color: idleColorPicker(calculatedMetrics, 'overall'),
									},
								]}>
								{calculatedMetrics.totalTime}
							</Text>
						</View>
					</View>
				</View>
			</View>
		);
	};

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
									<View style={styles.card}>
										<SummaryCard />
									</View>
									<View style={styles.card}>
										<Text style={styles.subHeading}>Orders</Text>
										<FlatList
											style={{ minWidth: '100%' }}
											data={filteredOrders}
											keyExtractor={(item) => `${item.date}-${item.id}`}
											renderItem={({ item }) => (
												<OrderCard
													order={item}
													onPress={() =>
														console.log(`order pressed: ${item.id}`)
													}
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
	orderCard: {
		flexDirection: 'column',
		alignItems: 'stretch',
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#eee',
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
	statsRow: {
		flexDirection: 'row',
		flexWrap: 'nowrap',
		justifyContent: 'space-between',
		gap: 8,
		marginTop: 6,
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
