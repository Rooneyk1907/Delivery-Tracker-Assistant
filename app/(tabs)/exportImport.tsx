import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useState } from 'react';

import { Alert, Pressable, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEYS = [
	'@long_term_storage',
	'@temp_storage_live_tracking',
	'@temp_storage_order_entry_draft',
] as const;

type ExportRow = {
	key: string;
	json: string;
};

export default function ExportImport() {
	const [status, setStatus] = useState<string>('');

	const handleExport = async () => {};

	const handleImport = async () => {};

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.container}>
				<Text style={styles.title}>Import / Export</Text>
				<Text style={styles.subtitle}>
					Export app storage to CSV, or import a previously exported CSV file.
				</Text>

				<Pressable
					style={styles.button}
					onPress={handleExport}>
					<Text style={styles.buttonText}>Export CSV</Text>
				</Pressable>

				<Pressable
					style={styles.buttonSecondary}
					onPress={handleImport}>
					<Text style={styles.buttonText}>Import CSV</Text>
				</Pressable>

				{!!status && <Text style={styles.status}>{status}</Text>}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: '#10141a',
	},
	container: {
		flex: 1,
		padding: 16,
		gap: 12,
	},
	title: {
		fontSize: 24,
		fontWeight: '800',
		color: '#f4f7fb',
	},
	subtitle: {
		fontSize: 14,
		color: '#c5d0e0',
		marginBottom: 8,
	},
	button: {
		backgroundColor: '#1e88e5',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 10,
	},
	buttonSecondary: {
		backgroundColor: '#43a047',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 10,
	},
	buttonText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 15,
		textAlign: 'center',
	},
	status: {
		marginTop: 8,
		color: '#dce6f5',
	},
});
