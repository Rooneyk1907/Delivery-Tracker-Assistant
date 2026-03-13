import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { useState } from 'react';

import {
	Alert,
	Pressable,
	View,
	Text,
	StyleSheet,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { workDay, type StoredDay } from '@/hooks/useStorage';

import type { Order } from '@/types/order';
import type { Shift } from '@/types/workday';

const LONG_TERM_STORAGE_KEY = '@long_term_storage';

const STORAGE_KEYS = [
	'@long_term_storage',
	'@temp_storage_live_tracking',
	'@temp_storage_order_entry_draft',
] as const;

type ExportRow = {
	key: string;
	json: string;
};

type CsvRow = {
	workday_id: string;
	workday_date: string;
	workday_saved_at: string;
	workday_total_time: string;
	workday_active_time: string;
	workday_idle_time: string;
	workday_shift_count: string;
	workday_shifts: string; // HH:MM-HH:MM(duration);...
	workday_total_gross: string;
	workday_total_net: string;
	workday_active_hourly_gross: string;
	workday_active_hourly_net: string;
	workday_overall_hourly_gross: string;
	workday_overall_hourly_net: string;

	order_id: string;
	order_service: string;
	order_restaurant: string;
	order_miles: string;
	order_start_time: string;
	order_rest_arrival_time: string;
	order_rest_departure_time: string;
	order_delivery_time: string;
	order_end_deadhead_time: string;
	order_to_restaurant: string;
	order_at_restaurant: string;
	order_to_customer: string;
	order_return_to_hotspot: string;
	order_total_duration: string;
	order_pay_gross: string;
	order_pay_net: string;
	order_pay_gross_hourly: string;
	order_pay_net_hourly: string;
};

const CSV_COLUMNS: (keyof CsvRow)[] = [
	'workday_id',
	'workday_date',
	'workday_saved_at',
	'workday_total_time',
	'workday_active_time',
	'workday_idle_time',
	'workday_shift_count',
	'workday_shifts',
	'workday_total_gross',
	'workday_total_net',
	'workday_active_hourly_gross',
	'workday_active_hourly_net',
	'workday_overall_hourly_gross',
	'workday_overall_hourly_net',
	'order_id',
	'order_service',
	'order_restaurant',
	'order_miles',
	'order_start_time',
	'order_rest_arrival_time',
	'order_rest_departure_time',
	'order_delivery_time',
	'order_end_deadhead_time',
	'order_to_restaurant',
	'order_at_restaurant',
	'order_to_customer',
	'order_return_to_hotspot',
	'order_total_duration',
	'order_pay_gross',
	'order_pay_net',
	'order_pay_gross_hourly',
	'order_pay_net_hourly',
];

function csvEscape(value: string): string {
	return `"${(value ?? '').replace(/"/g, '""')}"`;
}

function parseCsvLine(line: string): string[] {
	const out: string[] = [];
	let cur = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			if (inQuotes && line[i + 1] === '"') {
				cur += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (ch === ',' && !inQuotes) {
			out.push(cur);
			cur = '';
		} else {
			cur += ch;
		}
	}
	out.push(cur);
	return out;
}

function serializeShifts(shifts: Shift[]): string {
	return shifts
		.map((s) => `${s.clockInTime}-${s.clockOutTime}(${s.duration})`)
		.join(';');
}

function deserializeShifts(raw: string): Shift[] {
	if (!raw.trim()) return [];

	return raw.split(';').map((part) => {
		const m = part.match(/^(.+)-(.+)\((\d+)\)$/);
		if (!m)
			return {
				clockInTime: '',
				clockOutTime: '',
				duration: 0,
			};
		return {
			clockInTime: m[1],
			clockOutTime: m[2],
			duration: Number(m[3]) || 0,
		};
	});
}

function toCsv(rows: ExportRow[]): string {
	const header = 'key.json';
	const body = rows.map(
		(row) => `${csvEscape(row.key)},${csvEscape(row.json)}`,
	);
	return [header, ...body].join('\n');
}

function parseCsv(csv: string): ExportRow[] {
	const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
	if (lines.length <= 1) return [];

	return lines.slice(1).map((line) => {
		const commaIndex = line.indexOf(',');
		if (commaIndex === -1) throw new Error(`Invalid CSV line: ${line}`);

		const rawKey = line.slice(0, commaIndex).trim();
		const rawJson = line.slice(commaIndex + 1).trim();

		const unquote = (value: string) => {
			let out = value;
			if (out.startsWith('"') && out.endsWith('"')) {
				out = out.slice(1, -1);
			}
			return out.replace(/""/g, '"');
		};

		return {
			key: unquote(rawKey),
			json: unquote(rawJson),
		};
	});
}

function workDaysToCsv(workDays: any[]): string {
	const header = CSV_COLUMNS.join(',');

	const rows = workDays.flatMap((day) => {
		const base = {
			workday_id: day.id ?? '',
			workday_date: day.date ?? '',
			workday_saved_at: day.savedAt ?? '',
			workday_total_time: day.totalTime ?? '',
			workday_active_time: day.activeTime ?? '',
			workday_idle_time: day.idleTime ?? '',
			workday_shift_count: String(day.shifts?.length ?? 0),
			workday_shifts: serializeShifts(day.shifts ?? []),
			workday_total_gross: String(day.totalPay?.gross ?? 0),
			workday_total_net: String(day.totalPay?.net ?? 0),
			workday_active_hourly_gross: String(day.totalPay?.activeHourlyGross ?? 0),
			workday_active_hourly_net: String(day.totalPay?.activeHourlyNet ?? 0),
			workday_overall_hourly_gross: String(
				day.totalPay?.overallHourlyGross ?? 0,
			),
			workday_overall_hourly_net: String(day.totalPay?.overallHourlyNet ?? 0),
		};

		if (!day.orders?.length) {
			const emptyOrder = {
				order_id: '',
				order_service: '',
				order_restaurant: '',
				order_miles: '',
				order_start_time: '',
				order_rest_arrival_time: '',
				order_rest_departure_time: '',
				order_delivery_time: '',
				order_end_deadhead_time: '',
				order_to_restaurant: '',
				order_at_restaurant: '',
				order_to_customer: '',
				order_return_to_hotspot: '',
				order_total_duration: '',
				order_pay_gross: '',
				order_pay_net: '',
				order_pay_gross_hourly: '',
				order_pay_net_hourly: '',
			};
			return [{ ...base, ...emptyOrder }];
		}

		return day.orders.map((o: any) => ({
			...base,
			order_id: o.id ?? '',
			order_service: o.service ?? '',
			order_restaurant: o.restaurant ?? '',
			order_miles: String(o.miles ?? 0),
			order_start_time: o.timestamps?.startTime ?? '',
			order_rest_arrival_time: o.timestamps?.restArrivalTime ?? '',
			order_rest_departure_time: o.timestamps?.restDepartureTime ?? '',
			order_delivery_time: o.timestamps?.deliveryTime ?? '',
			order_end_deadhead_time: o.timestamps?.endDeadheadTime ?? '',
			order_to_restaurant: String(o.segments?.toRestaurant ?? 0),
			order_at_restaurant: String(o.segments?.atRestaurant ?? 0),
			order_to_customer: String(o.segments?.toCustomer ?? 0),
			order_return_to_hotspot: String(o.segments?.returnToHotspot ?? 0),
			order_total_duration: String(o.totalDuration ?? 0),
			order_pay_gross: String(o.pay?.gross ?? 0),
			order_pay_net: String(o.pay?.net ?? 0),
			order_pay_gross_hourly: String(o.pay?.grossHourly ?? 0),
			order_pay_net_hourly: String(o.pay?.netHourly ?? 0),
		}));
	});

	const body = rows.map((row) =>
		CSV_COLUMNS.map((c) => csvEscape(String(row[c] ?? ''))).join(','),
	);

	return [header, ...body].join('\n');
}

function csvToWorkDays(csv: string): any[] {
	const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
	if (lines.length < 2) return [];

	const header = parseCsvLine(lines[0]);
	const idx = Object.fromEntries(header.map((h, i) => [h, i]));

	const get = (cells: string[], key: keyof CsvRow) => cells[idx[key]] ?? '';

	const days = new Map<string, any>();

	for (const line of lines.slice(1)) {
		const cells = parseCsvLine(line);
		const workdayId = get(cells, 'workday_id');
		if (!workdayId) continue;

		let day = days.get(workdayId);
		if (!day) {
			day = {
				id: workdayId,
				date: get(cells, 'workday_date'),
				savedAt: get(cells, 'workday_saved_at'),
				totalTime: get(cells, 'workday_total_time'),
				activeTime: get(cells, 'workday_active_time'),
				idleTime: get(cells, 'workday_idle_time'),
				shifts: deserializeShifts(get(cells, 'workday_shifts')),
				totalPay: {
					gross: Number(get(cells, 'workday_total_gross')) || 0,
					net: Number(get(cells, 'workday_total_net')) || 0,
					activeHourlyGross:
						Number(get(cells, 'workday_active_hourly_gross')) || 0,
					activeHourlyNet: Number(get(cells, 'workday_active_hourly_net')) || 0,
					overallHourlyGross:
						Number(get(cells, 'workday_overall_hourly_gross')) || 0,
					overallHourlyNet:
						Number(get(cells, 'workday_overall_hourly_net')) || 0,
				},
				orders: [],
			};
			days.set(workdayId, day);
		}

		const orderId = get(cells, 'order_id');
		if (orderId) {
			day.orders.push({
				id: orderId,
				date: get(cells, 'workday_date'),
				service: get(cells, 'order_service'),
				restaurant: get(cells, 'order_restaurant'),
				miles: Number(get(cells, 'order_miles')) || 0,
				timestamps: {
					startTime: get(cells, 'order_start_time'),
					restArrivalTime: get(cells, 'order_rest_arrival_time'),
					restDepartureTime: get(cells, 'order_rest_departure_time'),
					deliveryTime: get(cells, 'order_delivery_time'),
					endDeadheadTime: get(cells, 'order_end_deadhead_time'),
				},
				segments: {
					toRestaurant: Number(get(cells, 'order_to_restaurant')) || 0,
					atRestaurant: Number(get(cells, 'order_at_restaurant')) || 0,
					toCustomer: Number(get(cells, 'order_to_customer')) || 0,
					returnToHotspot: Number(get(cells, 'order_return_to_hotspot')) || 0,
				},
				totalDuration: Number(get(cells, 'order_total_duration')) || 0,
				pay: {
					gross: Number(get(cells, 'order_pay_gross')) || 0,
					net: Number(get(cells, 'order_pay_net')) || 0,
					grossHourly: Number(get(cells, 'order_pay_gross_hourly')) || 0,
					netHourly: Number(get(cells, 'order_pay_net_hourly')) || 0,
				},
			});
		}
	}

	return Array.from(days.values());
}

async function downloadCsvOnWeb(csv: string, fileName: string) {
	const webDoc = (globalThis as any).document;
	if (!webDoc) throw new Error('Browser document API is unavailable');

	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = webDoc.createElement('a');
	a.href = url;
	a.download = fileName;
	webDoc.body.appendChild(a);
	a.click();
	webDoc.body.removeChild(a);
	URL.revokeObjectURL(url);
}

async function readCsvFromPickedFile(
	asset: DocumentPicker.DocumentPickerAsset,
): Promise<string> {
	if (Platform.OS === 'web') {
		const webFile = (asset as any).file as File | undefined;
		if (webFile && typeof webFile.text === 'function') {
			return await webFile.text();
		}
		if (asset.uri) {
			const resp = await fetch(asset.uri);
			return await resp.text();
		}
		throw new Error('No web file payload returned by picker');
	}

	return await FileSystem.readAsStringAsync(asset.uri, {
		encoding: FileSystem.EncodingType.UTF8,
	});
}

export default function ExportImport() {
	const [status, setStatus] = useState<string>('');

	const handleExport = async () => {
		try {
			setStatus('Preparing export...');

			const raw = await AsyncStorage.getItem(LONG_TERM_STORAGE_KEY);
			const workDays: StoredDay[] = raw ? (JSON.parse(raw) as StoredDay[]) : [];

			const csv = workDaysToCsv(workDays);
			const fileName = `delivery-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;

			if (Platform.OS === 'web') {
				await downloadCsvOnWeb(csv, fileName);
			} else {
				const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

				await FileSystem.writeAsStringAsync(fileUri, csv, {
					encoding: FileSystem.EncodingType.UTF8,
				});

				const canShare = await Sharing.isAvailableAsync();
				if (canShare) {
					await Sharing.shareAsync(fileUri, {
						mimeType: 'text/csv',
						dialogTitle: 'Export Delivery Tracker Data',
						UTI: 'public.comma-separated-values-text',
					});
				} else {
					Alert.alert('Export complete', `CSV saved to:\n${fileUri}`);
				}
			}
			setStatus('Export complete.');
		} catch (error) {
			console.error('Export failed', error);
			setStatus('Export failed.');
			Alert.alert('Export failed', 'Could not export data to CSV');
		}
	};

	const handleImport = async () => {
		try {
			setStatus('Choosing file...');

			const result = await DocumentPicker.getDocumentAsync({
				type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
				copyToCacheDirectory: true,
				multiple: false,
			});

			if (result.canceled) {
				setStatus('Import canceled.');
				return;
			}

			const asset = result.assets[0];

			setStatus('Reading CSV...');
			const csv = await readCsvFromPickedFile(asset);
			const workDays = csvToWorkDays(csv);

			setStatus('Aplying import...');
			await AsyncStorage.setItem(
				LONG_TERM_STORAGE_KEY,
				JSON.stringify(workDays),
			);

			setStatus('Import complete.');
			Alert.alert('Import complete', 'WorkDay/Order data restored from CSV.');
		} catch (error) {
			console.error('Import failed', error);
			setStatus('Import failed.');
			Alert.alert('Import failed', 'Could not import CSV. Check file format');
		}
	};

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
