/* eslint-disable @typescript-eslint/no-unused-vars */

import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import colors from '@/constants/Colors';

import Dashboard from '@/components/dashboard';

const COST_PER_MILE = 0.67;

export default function Index() {
	return (
		<SafeAreaView style={styles.safe}>
			<Dashboard />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.dark,
	},
});
