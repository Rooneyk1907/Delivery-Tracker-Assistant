import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import colors from '@/constants/Colors';
import { seedWorkDaysFromSample } from '@/hooks/useStorage';

export default function RootLayout() {
	useEffect(() => {
		if (__DEV__ && process.env.EXPO_PUBLIC_ENABLE_SAMPLE_SEED === 'true') {
			seedWorkDaysFromSample({ force: false });
		}
	}, []);

	return (
		<View style={styles.appBase}>
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: colors.dark },
				}}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	appBase: {
		flex: 1,
		margin: 0,
		padding: 15,
		backgroundColor: colors.dark,
		fontFamily: 'sans-serif',
	},
});
