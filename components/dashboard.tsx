import { useState, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';

import { DashboardMetrics } from '@/types/dashboardmetrics';
import { WorkDay } from '@/types/workday';
import { Order } from '@/types/order';

import { workDay, liveTracking } from '@/hooks/useStorage';

import colors from '@/constants/Colors';

import { calculateDashboardMetrics } from '@/helpers/statCalculations';

// TODO: Dashboard updates:
//		- Dashboard only displays stats from current day (history page can display summary of multiple days)

export default function Dashboard() {
	const dayStore = useMemo(() => workDay(), []);
	const trackingStore = useMemo(() => liveTracking(), []);
	const { getWorkDay } = dayStore;
	const { load: loadActiveTracking } = trackingStore;

	const [isLoading, setIsLoading] = useState(true);
	const [metrics, setMetrics] = useState<DashboardMetrics>();
	const [todayData, setTodayData] = useState<WorkDay>();

	const inFlightRef = useRef(false);

	const refreshDashboard = useCallback(async () => {
		if (inFlightRef.current) return;
		inFlightRef.current = true;

		try {
			const today = new Date().toISOString().slice(0, 10);
			const day = await getWorkDay(today);

			if (!day) {
				setTodayData(undefined);
				setMetrics(undefined);
				setIsLoading(false);
				return;
			}

			let dayForMetrics: WorkDay = day;
			const active = await loadActiveTracking();

			if (active && active.date === today) {
				const elapsedSeconds = Math.max(
					0,
					Math.floor((Date.now() - active.startMs) / 1000),
				);

				const hours = elapsedSeconds / 3600;

				const liveOrder: Order = {
					id: active.id,
					date: active.date,
					service: active.service,
					restaurant: active.restaurant,
					miles: active.miles,
					timestamps: active.timestamps,
					segments: active.segments,
					totalDuration: elapsedSeconds,
					pay: {
						gross: active.pay.gross,
						net: active.pay.net,
						grossHourly: hours > 0 ? active.pay.gross / hours : 0,
						netHourly: hours > 0 ? active.pay.net / hours : 0,
					},
				};

				dayForMetrics = {
					...day,
					orders: [
						...day.orders.filter((order) => order.id !== liveOrder.id),
						liveOrder,
					],
				};
			}

			setTodayData(dayForMetrics);
			setMetrics(calculateDashboardMetrics(dayForMetrics));
			setIsLoading(false);
		} catch (error) {
			console.error('Dashboard refress failed', error);
			setIsLoading(false);
		} finally {
			inFlightRef.current = false;
		}
	}, [getWorkDay, loadActiveTracking]);

	useFocusEffect(
		useCallback(() => {
			let active = true;
			let timeoutId: ReturnType<typeof setTimeout> | null = null;

			const loop = async () => {
				if (!active) return;
				await refreshDashboard();
				if (!active) return;
				timeoutId = setTimeout(loop, 2500);
			};

			void loop();

			return () => {
				active = false;
				if (timeoutId) clearTimeout(timeoutId);
			};
		}, [refreshDashboard]),
	);

	return (
		<>
			{isLoading ? (
				<Text style={{ color: colors.labelText, textAlign: 'center' }}>
					Loading...
				</Text>
			) : todayData && metrics ? (
				<View style={styles.dashboardWrapper}>
					<Text style={styles.dashboardTitle}>Dashboard</Text>
					<View style={styles.primaryStatBox}>
						<Text style={styles.grossPay}>
							Gross: ${metrics.totalGross.toFixed(2)}
						</Text>
						<Text style={styles.netPay}>${metrics.totalNet.toFixed(2)}</Text>
						<Text style={styles.netLabel}>Estimated Net Profit</Text>
					</View>
					<View style={styles.subStats}>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Overall Hourly Gross</Text>
							<Text style={styles.subStatDisplay}>
								$
								{isFinite(metrics.totalOverallHourlyGross)
									? metrics.totalOverallHourlyGross.toFixed(2)
									: '0.00'}
							</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Overall Hourly Net</Text>
							<Text style={[styles.subStatDisplay, { color: colors.net }]}>
								$
								{isFinite(metrics.totalOverallHourlyNet)
									? metrics.totalOverallHourlyNet.toFixed(2)
									: '0.00'}
							</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Total Idle Time</Text>
							<Text style={styles.subStatDisplay}>{metrics.totalIdleTime}</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Active Hourly Net</Text>
							<Text style={[styles.subStatDisplay, { color: colors.net }]}>
								$
								{isFinite(metrics.totalActiveHourlyNet)
									? metrics.totalActiveHourlyNet.toFixed(2)
									: '0.00'}
							</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Active Hourly Gross</Text>
							<Text style={styles.subStatDisplay}>
								$
								{isFinite(metrics.totalActiveHourlyGross)
									? metrics.totalActiveHourlyGross.toFixed(2)
									: '0.00'}
							</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Total Miles</Text>
							<Text style={styles.subStatDisplay}>
								{metrics.totalMiles.toFixed(1)} mi
							</Text>
						</View>
					</View>
				</View>
			) : (
				<Text style={{ color: colors.labelText, textAlign: 'center' }}>
					No data for today
				</Text>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	dashboardWrapper: {
		backgroundColor: '#eee',
		padding: 15,
		paddingTop: 10,
		borderWidth: 2,
		borderColor: '#eee',
		borderRadius: 12,
		margin: 15,
	},
	dashboardTitle: {
		alignSelf: 'center',
		color: colors.primary,
		fontWeight: '800',
		fontSize: 45,
		textTransform: 'uppercase',
		marginBottom: 16,
	},
	grossPay: {
		fontSize: 18,
		color: colors.labelText,
	},
	netPay: {
		fontSize: 45,
		fontWeight: '800',
		color: colors.net,
		margin: 0,
	},
	netLabel: {
		fontSize: 11,
		fontWeight: 'bold',
		color: colors.net,
		textTransform: 'uppercase',
		paddingBottom: 10,
	},
	primaryStatBox: {
		flexDirection: 'column',
		backgroundColor: '#f8f9fa',
		padding: 10,
		borderWidth: 1,
		borderColor: '#eee',
		borderRadius: 12,
		alignItems: 'center',
		marginBottom: 12,
	},
	subStatBox: {
		flex: 1,
		minWidth: '30%',
		backgroundColor: '#f8f9fa',
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#eee',
		alignItems: 'center',
	},
	subStatDisplay: {
		fontSize: 10,
		fontWeight: 'bold',
		color: colors.dark,
		marginTop: 4,
	},
	subStats: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		gap: 8,
	},
	label: {
		fontSize: 10,
		color: colors.labelText,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
});
