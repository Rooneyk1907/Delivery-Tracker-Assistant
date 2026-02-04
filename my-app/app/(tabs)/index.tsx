/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import colors from '@/constants/Colors';
import { getOrders, StoredOrder } from '@/hooks/useOrdersStorage';

const COST_PER_MILE = 0.67;

function calculateMetrics(orders: StoredOrder[]) {
  if (orders.length === 0) {
    return {
      totalGross: 0,
      totalMiles: 0,
      estimatedNet: 0,
      totalHours: 0,
      totalHourlyGross: 0,
      totalHourlyNet: 0,
      totalIdleMs: 0,
      acceptanceRate: 0,
    };
  }

  let totalGross = 0;
  let totalMiles = 0;
  let totalDurationMs = 0;
  let toRestaurantMs = 0;
  let atRestaurantMs = 0;

  orders.forEach((order) => {
    totalGross += order.pay;
    totalMiles += order.miles;

    // Parse totalDuration HH:MM:SS to milliseconds
    if (order.totalDuration) {
      const [hh, mm, ss] = order.totalDuration.split(':').map(Number);
      totalDurationMs += (hh * 3600 + mm * 60 + (ss || 0)) * 1000;
    }

    // Sum segment times (in minutes) and convert to ms
    toRestaurantMs += (order.segments.toRestaurant || 0) * 60 * 1000;
    atRestaurantMs += (order.segments.atRestaurant || 0) * 60 * 1000;
  });

  const totalMilesCost = totalMiles * COST_PER_MILE;
  const estimatedNet = totalGross - totalMilesCost;
  const totalHours = totalDurationMs / (1000 * 60 * 60) || 0;
  const totalHourlyGross = totalHours > 0 ? totalGross / totalHours : 0;
  const totalHourlyNet = totalHours > 0 ? estimatedNet / totalHours : 0;

  // Idle time = time at restaurant (waiting)
  const totalIdleMs = atRestaurantMs;
  const totalIdleMins = Math.round(totalIdleMs / 60000);

  // Acceptance rate: assuming all tracked orders = accepted (100%)
  const acceptanceRate = 100;

  return {
    totalGross,
    totalMiles,
    estimatedNet,
    totalHours,
    totalHourlyGross,
    totalHourlyNet,
    totalIdleMs: totalIdleMins,
    acceptanceRate,
  };
}

function formatIdleTime(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default function Index() {
  // const { getOrders } = useOrdersStorage();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalGross: 0,
    totalMiles: 0,
    estimatedNet: 0,
    totalHours: 0,
    totalHourlyGross: 0,
    totalHourlyNet: 0,
    totalIdleMs: 0,
    acceptanceRate: 0,
  });

  useEffect(() => {
    (async () => {
      const orders = await getOrders();
      const calculated = calculateMetrics(orders);
      setMetrics(calculated);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.dashboardWrapper}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
          <Text style={{ color: colors.labelText, textAlign: 'center' }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.dashboardWrapper}>
        <Text style={styles.dashboardTitle}>Dashboard</Text>

        <View style={styles.mainStats}>
          <Text style={styles.grossPay}>Gross: ${metrics.totalGross.toFixed(2)}</Text>
          <Text style={styles.netPay}>${metrics.estimatedNet.toFixed(2)}</Text>
          <Text style={styles.netLabel}>Estimated Net Profit</Text>
        </View>

        <View style={styles.subStats}>
          <View style={styles.subStatBox}>
            <Text style={styles.label}>Hourly Gross</Text>
            <Text style={styles.subStatDisplay}>${metrics.totalHourlyGross.toFixed(2)}</Text>
          </View>

          <View style={styles.subStatBox}>
            <Text style={styles.label}>Hourly Net</Text>
            <Text style={[styles.subStatDisplay, {color: colors.net} ]}>${metrics.totalHourlyNet.toFixed(2)}</Text>
          </View>

          <View style={styles.subStatBox}>
            <Text style={styles.label}>Total Idle Time</Text>
            <Text style={styles.subStatDisplay}>{formatIdleTime(metrics.totalIdleMs)}</Text>
          </View>

          <View style={styles.subStatBox}>
            <Text style={styles.label}>Total Miles</Text>
            <Text style={styles.subStatDisplay}>{metrics.totalMiles.toFixed(1)} mi</Text>
          </View>

          <View style={styles.subStatBox}>
            <Text style={styles.label}>Acceptance Rate</Text>
            <Text style={styles.subStatDisplay}>{metrics.acceptanceRate.toFixed(0)}%</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.dark,
  },
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

  subStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: 4,
  },

  label: {
    fontSize: 10,
    color: colors.labelText,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});