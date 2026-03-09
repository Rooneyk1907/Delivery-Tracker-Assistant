import { View, Text, StyleSheet } from 'react-native';

import { WorkDay } from '@/types/workday';
import { Order } from '@/types/order';
import { DashboardMetrics } from '@/types/dashboardmetrics';

import {
	calculateDashboardMetrics,
	parseDurationToSeconds,
} from '@/helpers/helper';

import colors from '@/constants/Colors';

type SummaryCardProps = {
	workDays: WorkDay[];
	orders: Order[];
};

export default function summaryCard({ workDays, orders }: SummaryCardProps) {
	function colorPicker(metrics: DashboardMetrics, type: string) {
		const idleTime = parseDurationToSeconds(metrics.totalIdleTime);
		const activeTime = parseDurationToSeconds(metrics.totalActiveTime);
		const totalTime = parseDurationToSeconds(metrics.totalTime);

		const idlePercentage = idleTime / totalTime;
		const activePercentage = activeTime / totalTime;

		if (Number.isNaN(idlePercentage)) return colors.dark;

		switch (type) {
			case 'idle': {
				if (idlePercentage > 0.25) return colors.warning;
				else return colors.success;
			}
			case 'active': {
				if (activePercentage > 0.5) return colors.success;
				else return colors.warning;
			}

			default:
				return colors.dark;
		}
	}

	const calculatedMetrics = calculateDashboardMetrics(workDays);

	return (
		<View style={styles.section}>
			<View style={styles.statsRow}>
				<View style={styles.subStatBox}>
					<Text style={styles.label}>Worked Days: </Text>
					<Text style={styles.subStatDisplay}>{workDays.length}</Text>
				</View>
				<View style={styles.subStatBox}>
					<Text style={styles.label}>Orders: </Text>
					<Text style={styles.subStatDisplay}>{orders.length}</Text>
				</View>
			</View>
			<View>
				<Text style={styles.sectionHeading}>Pay</Text>
				<View style={styles.statsRow}>
					<View style={styles.subStatBox}>
						<Text style={styles.label}>Gross</Text>
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
						<Text style={styles.label}>Net</Text>
						<Text style={[styles.subStatDisplay, styles.netPay]}>
							${calculatedMetrics.totalNet.toFixed(2)}
						</Text>
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
									{ color: colorPicker(calculatedMetrics, 'active') },
								]}>
								{calculatedMetrics.totalActiveTime}
							</Text>
						</View>
						<View style={styles.subStatBox}>
							<Text style={styles.label}>Total Idle Time</Text>
							<Text
								style={[
									styles.subStatDisplay,
									{ color: colorPicker(calculatedMetrics, 'idle') },
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
										color: colorPicker(calculatedMetrics, 'overall'),
									},
								]}>
								{calculatedMetrics.totalTime}
							</Text>
						</View>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	section: {
		minWidth: '100%',
	},
	sectionHeading: {
		fontSize: 17,
		fontWeight: '800',
		color: colors.labelText,
		textTransform: 'uppercase',
		marginTop: 8,
	},
	subHeading: {
		alignSelf: 'center',
		color: colors.labelText,
		fontWeight: '800',
		fontSize: 32,
		textTransform: 'uppercase',
		marginBottom: 14,
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
		backgroundColor: colors.background,
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
