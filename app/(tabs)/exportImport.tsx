import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';

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

type WorkDayCsvRow = {
	id: string;
	date: string;
	saved_at: string;
	total_time: string;
	active_time: string;
	idle_time: string;
	shift_count: string;
	shifts: string;
	total_gross: string;
	total_net: string;
	active_hourly_gross: string;
	active_hourly_net: string;
	overall_hourly_gross: string;
	overall_hourly_net: string;
};

type OrderCsvRow = {
	workday_id: string;
	workday_date: string;
	order_id: string;
	service: string;
	restaurant: string;
	miles: string;
	start_time: string;
	rest_arrival_time: string;
	rest_departure_time: string;
	delivery_time: string;
	end_deadhead_time: string;
	to_restaurant: string;
	at_restaurant: string;
	to_customer: string;
	return_to_hotspot: string;
	total_duration: string;
	pay_gross: string;
	pay_net: string;
	pay_gross_hourly: string;
	pay_net_hourly: string;
};

const WORKDAY_COLUMNS: (keyof WorkDayCsvRow)[] = [
	'id',
	'date',
	'saved_at',
	'total_time',
	'active_time',
	'idle_time',
	'shift_count',
	'shifts',
	'total_gross',
	'total_net',
	'active_hourly_gross',
	'active_hourly_net',
	'overall_hourly_gross',
	'overall_hourly_net',
];

const ORDER_COLUMNS: (keyof OrderCsvRow)[] = [
	'workday_id',
	'workday_date',
	'order_id',
	'service',
	'restaurant',
	'miles',
	'start_time',
	'rest_arrival_time',
	'rest_departure_time',
	'delivery_time',
	'end_deadhead_time',
	'to_restaurant',
	'at_restaurant',
	'to_customer',
	'return_to_hotspot',
	'total_duration',
	'pay_gross',
	'pay_net',
	'pay_gross_hourly',
	'pay_net_hourly',
];

function csvEscape(value: string): string {
	return `"${(value ?? '').replace(/"/g, '""')}"`;
}

function rowsToCsv<T extends Record<string, string>>(
	columns: (keyof T)[],
	rows: T[],
): string {
	const header = columns.join(',');
	const body = rows.map((row) => {
		return columns.map((c) => csvEscape(String(row[c] ?? ''))).join(',');
	});
	return [header, ...body].join('\n');
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

function workDaysToCsv(workDays: StoredDay[]): string {
	const rows: WorkDayCsvRow[] = workDays.map((day) => ({
		id: day.id ?? '',
		date: day.date ?? '',
		saved_at: day.savedAt ?? '',
		total_time: day.totalTime ?? '',
		active_time: day.activeTime ?? '',
		idle_time: day.idleTime ?? '',
		shift_count: String(day.shifts?.length ?? 0),
		shifts: serializeShifts(day.shifts ?? []),
		total_gross: String(day.totalPay?.gross ?? 0),
		total_net: String(day.totalPay?.net ?? 0),
		active_hourly_gross: String(day.totalPay?.activeHourlyGross ?? 0),
		active_hourly_net: String(day.totalPay?.activeHourlyNet ?? 0),
		overall_hourly_gross: String(day.totalPay?.overallHourlyGross ?? 0),
		overall_hourly_net: String(day.totalPay?.overallHourlyNet ?? 0),
	}));
	return rowsToCsv(WORKDAY_COLUMNS, rows);
}

function ordersToCsv(workDays: StoredDay[]): string {
	const rows: OrderCsvRow[] = workDays.flatMap((day) =>
		(day.orders ?? []).map((o) => ({
			workday_id: day.id ?? '',
			workday_date: day.date ?? '',
			order_id: o.id ?? '',
			service: o.service ?? '',
			restaurant: o.restaurant ?? '',
			miles: String(o.miles ?? 0),
			start_time: o.timestamps?.startTime ?? '',
			rest_arrival_time: o.timestamps?.restArrivalTime ?? '',
			rest_departure_time: o.timestamps?.restDepartureTime ?? '',
			delivery_time: o.timestamps?.deliveryTime ?? '',
			end_deadhead_time: o.timestamps?.endDeadheadTime ?? '',
			to_restaurant: String(o.segments?.toRestaurant ?? 0),
			at_restaurant: String(o.segments?.atRestaurant ?? 0),
			to_customer: String(o.segments?.toCustomer ?? 0),
			return_to_hotspot: String(o.segments?.returnToHotspot ?? 0),
			total_duration: String(o.totalDuration ?? 0),
			pay_gross: String(o.pay?.gross ?? 0),
			pay_net: String(o.pay?.net ?? 0),
			pay_gross_hourly: String(o.pay?.grossHourly ?? 0),
			pay_net_hourly: String(o.pay?.netHourly ?? 0),
		})),
	);

	return rowsToCsv(ORDER_COLUMNS, rows);
}

// function csvToWorkDays(csv: string): any[] {
// 	const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
// 	if (lines.length < 2) return [];

// 	const header = parseCsvLine(lines[0]);
// 	const idx = Object.fromEntries(header.map((h, i) => [h, i]));

// 	const get = (cells: string[], key: keyof CsvRow) => cells[idx[key]] ?? '';

// 	const days = new Map<string, any>();

// 	for (const line of lines.slice(1)) {
// 		const cells = parseCsvLine(line);
// 		const workdayId = get(cells, 'workday_id');
// 		if (!workdayId) continue;

// 		let day = days.get(workdayId);
// 		if (!day) {
// 			day = {
// 				id: workdayId,
// 				date: get(cells, 'workday_date'),
// 				savedAt: get(cells, 'workday_saved_at'),
// 				totalTime: get(cells, 'workday_total_time'),
// 				activeTime: get(cells, 'workday_active_time'),
// 				idleTime: get(cells, 'workday_idle_time'),
// 				shifts: deserializeShifts(get(cells, 'workday_shifts')),
// 				totalPay: {
// 					gross: Number(get(cells, 'workday_total_gross')) || 0,
// 					net: Number(get(cells, 'workday_total_net')) || 0,
// 					activeHourlyGross:
// 						Number(get(cells, 'workday_active_hourly_gross')) || 0,
// 					activeHourlyNet: Number(get(cells, 'workday_active_hourly_net')) || 0,
// 					overallHourlyGross:
// 						Number(get(cells, 'workday_overall_hourly_gross')) || 0,
// 					overallHourlyNet:
// 						Number(get(cells, 'workday_overall_hourly_net')) || 0,
// 				},
// 				orders: [],
// 			};
// 			days.set(workdayId, day);
// 		}

// 		const orderId = get(cells, 'order_id');
// 		if (orderId) {
// 			day.orders.push({
// 				id: orderId,
// 				date: get(cells, 'workday_date'),
// 				service: get(cells, 'order_service'),
// 				restaurant: get(cells, 'order_restaurant'),
// 				miles: Number(get(cells, 'order_miles')) || 0,
// 				timestamps: {
// 					startTime: get(cells, 'order_start_time'),
// 					restArrivalTime: get(cells, 'order_rest_arrival_time'),
// 					restDepartureTime: get(cells, 'order_rest_departure_time'),
// 					deliveryTime: get(cells, 'order_delivery_time'),
// 					endDeadheadTime: get(cells, 'order_end_deadhead_time'),
// 				},
// 				segments: {
// 					toRestaurant: Number(get(cells, 'order_to_restaurant')) || 0,
// 					atRestaurant: Number(get(cells, 'order_at_restaurant')) || 0,
// 					toCustomer: Number(get(cells, 'order_to_customer')) || 0,
// 					returnToHotspot: Number(get(cells, 'order_return_to_hotspot')) || 0,
// 				},
// 				totalDuration: Number(get(cells, 'order_total_duration')) || 0,
// 				pay: {
// 					gross: Number(get(cells, 'order_pay_gross')) || 0,
// 					net: Number(get(cells, 'order_pay_net')) || 0,
// 					grossHourly: Number(get(cells, 'order_pay_gross_hourly')) || 0,
// 					netHourly: Number(get(cells, 'order_pay_net_hourly')) || 0,
// 				},
// 			});
// 		}
// 	}

// 	return Array.from(days.values());
// }

async function downloadBlobOnWeb(blob: Blob, fileName: string) {
	const webDoc = (globalThis as any).document;
	if (!webDoc) throw new Error('Browser document API is unavailable');

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

function parseCsvRows<T extends Record<string, string>>(csv: string): T[] {
	const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
	if (lines.length < 2) return [];

	const headers = parseCsvLine(lines[0]);

	return lines.slice(1).map((line) => {
		const cells = parseCsvLine(line);
		const row: Record<string, string> = {};
		headers.forEach((h, i) => {
			row[h] = cells[i] ?? '';
		});
		return row as T;
	});
}

function csvFilesToWorkDays(
	workdaysCsv: string,
	ordersCsv: string,
): StoredDay[] {
	const workdayRows = parseCsvRows<WorkDayCsvRow>(workdaysCsv);
	const orderRows = parseCsvRows<OrderCsvRow>(ordersCsv);

	const dayMap = new Map<string, StoredDay>();

	for (const r of workdayRows) {
		dayMap.set(r.id, {
			id: r.id,
			date: r.date,
			savedAt: r.saved_at,
			totalTime: r.total_time,
			activeTime: r.active_time,
			idleTime: r.idle_time,
			shifts: deserializeShifts(r.shifts),
			totalPay: {
				gross: Number(r.total_gross) || 0,
				net: Number(r.total_net) || 0,
				activeHourlyGross: Number(r.active_hourly_gross) || 0,
				activeHourlyNet: Number(r.active_hourly_net) || 0,
				overallHourlyGross: Number(r.overall_hourly_gross) || 0,
				overallHourlyNet: Number(r.overall_hourly_net) || 0,
			},
			orders: [],
		});
	}

	for (const r of orderRows) {
		if (!r.order_id) continue;
		const day = dayMap.get(r.workday_id);
		if (!day) continue;

		day.orders.push({
			id: r.order_id,
			date: r.workday_date || day.date,
			service: r.service,
			restaurant: r.restaurant,
			miles: Number(r.miles) || 0,
			timestamps: {
				startTime: r.start_time,
				restArrivalTime: r.rest_arrival_time,
				restDepartureTime: r.rest_departure_time,
				deliveryTime: r.delivery_time,
				endDeadheadTime: r.end_deadhead_time,
			},
			segments: {
				toRestaurant: Number(r.to_restaurant) || 0,
				atRestaurant: Number(r.at_restaurant) || 0,
				toCustomer: Number(r.to_customer) || 0,
				returnToHotspot: Number(r.return_to_hotspot) || 0,
			},
			totalDuration: Number(r.total_duration) || 0,
			pay: {
				gross: Number(r.pay_gross) || 0,
				net: Number(r.pay_net) || 0,
				grossHourly: Number(r.pay_gross_hourly) || 0,
				netHourly: Number(r.pay_net_hourly) || 0,
			},
		});
	}

	return Array.from(dayMap.values());
}

export default function ExportImport() {
	const [status, setStatus] = useState<string>('');

	const handleExport = async () => {
		try {
			setStatus('Preparing export...');

			const raw = await AsyncStorage.getItem(LONG_TERM_STORAGE_KEY);
			const workDays: StoredDay[] = raw ? (JSON.parse(raw) as StoredDay[]) : [];

			const workDaysCsv = workDaysToCsv(workDays);
			const ordersCsv = ordersToCsv(workDays);

			const zip = new JSZip();
			zip.file('workdays.csv', workDaysCsv);
			zip.file('orders.csv', ordersCsv);

			const datePart = new Date().toISOString().slice(0, 10);
			const zipName = `delivery-tracker-export-${datePart}.zip`;

			if (Platform.OS === 'web') {
				const blob = await zip.generateAsync({ type: 'blob' });
				await downloadBlobOnWeb(blob, zipName);
			} else {
				const base64Zip = await zip.generateAsync({ type: 'base64' });
				const fileUri = `${FileSystem.cacheDirectory}${zipName}`;

				await FileSystem.writeAsStringAsync(fileUri, base64Zip, {
					encoding: FileSystem.EncodingType.Base64,
				});

				const canShare = await Sharing.isAvailableAsync();
				if (canShare) {
					await Sharing.shareAsync(fileUri, {
						mimeType: 'application/zip',
						dialogTitle: 'Export Delivery Tracker Data',
						UTI: 'public.zip-archive',
					});
				} else {
					Alert.alert('Export complete', `CSV saved to:\n${fileUri}`);
				}
			}
			setStatus('Export complete.');
		} catch (error) {
			console.error('Export failed', error);
			setStatus('Export failed.');
			Alert.alert('Export failed', 'Could not export ZIP');
		}
	};

	const handleImport = async () => {
		try {
			setStatus('Choosing file...');

			const result = await DocumentPicker.getDocumentAsync({
				type: ['application/zip', 'application/x-zip-compressed'],
				copyToCacheDirectory: true,
				multiple: false,
			});

			if (result.canceled) {
				setStatus('Import canceled.');
				return;
			}

			const asset = result.assets[0];
			setStatus('Reading ZIP...');

			let zip: JSZip;
			if (Platform.OS === 'web') {
				const file = (asset as any).file as File | undefined;
				if (file) {
					const buffer = await file.arrayBuffer();
					zip = await JSZip.loadAsync(buffer);
				} else {
					const resp = await fetch(asset.uri);
					const buffer = await resp.arrayBuffer();
					zip = await JSZip.loadAsync(buffer);
				}
			} else {
				const base64Zip = await FileSystem.readAsStringAsync(asset.uri, {
					encoding: FileSystem.EncodingType.Base64,
				});
				zip = await JSZip.loadAsync(base64Zip, { base64: true });
			}

			const workdaysEntry = zip.file('workdays.csv');
			const ordersEntry = zip.file('orders.csv');

			if (!workdaysEntry || !ordersEntry) {
				throw new Error('ZIP must contain workdays.csv and orders.csv');
			}

			const workdaysCsv = await workdaysEntry.async('string');
			const ordersCsv = await ordersEntry.async('string');

			const workDays = csvFilesToWorkDays(workdaysCsv, ordersCsv);

			setStatus('Aplying import...');
			await AsyncStorage.setItem(
				LONG_TERM_STORAGE_KEY,
				JSON.stringify(workDays),
			);

			setStatus('Import complete.');
			Alert.alert('Import complete', 'WorkDay/Order data restored from ZIP.');
		} catch (error) {
			console.error('Import failed', error);
			setStatus('Import failed.');
			Alert.alert(
				'Import failed',
				'Could not import ZIP. ZIP must include workdays.csv and orders.csv',
			);
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
