/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import colors from '@/constants/Colors';
import {workDay} from '@/hooks/useStorage'

import { DashboardMetrics } from '@/types/dashboardmetrics';

import { calculateDashboardMetrics } from '@/helpers/helper';

const COST_PER_MILE = 0.67;


function formatIdleTime(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}


export default function Index() {
  const dayStore = workDay();
  const { loadAll, getWorkDay} = dayStore;

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>();

  useEffect(() => {
    (async () => {
      const workDays = await loadAll();

      if (workDays) {
        const calculated = calculateDashboardMetrics(workDays);
        setMetrics(calculated);
        setLoading(false);
      }

    })();
  }, []);

  // if (loading) {
  //   return (
  //     <SafeAreaView style={styles.safe}>
  //       <View style={styles.dashboardWrapper}>
  //         <Text style={styles.dashboardTitle}>Dashboard</Text>
  //         <Text style={{ color: colors.labelText, textAlign: 'center' }}>Loading...</Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }




    
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.dashboardWrapper}>
        <Text style={styles.dashboardTitle}>Dashboard</Text>

        { metrics !== undefined && !loading  ? (
        <>
          <View style={styles.mainStats}>
            <Text style={styles.grossPay}>Gross: ${metrics.totalGross.toFixed(2)}</Text>
            <Text style={styles.netPay}>${metrics.totalNet.toFixed(2)}</Text>
            <Text style={styles.netLabel}>Estimated Net Profit</Text>
          </View>

          <View style={styles.subStats}>
            <View style={styles.subStatBox}>
              <Text style={styles.label}>Overall Hourly Gross</Text>
              <Text style={styles.subStatDisplay}>${isFinite(metrics.totalOverallHourlyGross) ? metrics.totalOverallHourlyGross.toFixed(2) : '0.00' }</Text>
            </View>

            <View style={styles.subStatBox}>
              <Text style={styles.label}>Overall Hourly Net</Text>
              <Text style={[styles.subStatDisplay, {color: colors.net} ]}>${isFinite(metrics.totalOverallHourlyNet) ?  metrics.totalOverallHourlyNet.toFixed(2) : '0.00'}</Text>
            </View>

            <View style={styles.subStatBox}>
              <Text style={styles.label}>Total Idle Time</Text>
              <Text style={styles.subStatDisplay}>{metrics.totalIdleTime}</Text>
            </View>

            <View style={styles.subStatBox}>
              <Text style={styles.label}>Active Hourly Gross</Text>
              <Text style={styles.subStatDisplay}>${isFinite(metrics.totalActiveHourlyGross) ? metrics.totalActiveHourlyGross.toFixed(2): '0.00'}</Text>
            </View>

            <View style={styles.subStatBox}>
              <Text style={styles.label}>Active Hourly Net</Text>
              <Text style={[styles.subStatDisplay, {color: colors.net}]}>${isFinite(metrics.totalActiveHourlyNet) ? metrics.totalActiveHourlyNet.toFixed(2) : '0.00'}</Text>
            </View>

            <View style={styles.subStatBox}>
              <Text style={styles.label}>Total Miles</Text>
              <Text style={styles.subStatDisplay}>{metrics.totalMiles.toFixed(1)} mi</Text>
            </View>

            {/* <View style={styles.subStatBox}>
              <Text style={styles.label}>Acceptance Rate</Text>
              <Text style={styles.subStatDisplay}>{metrics.acceptanceRate.toFixed(0)}%</Text>
            </View> */}
          </View>
        </>
        ) : (
          <Text style={{ color: colors.labelText, textAlign: 'center' }}>Loading...</Text>
        ) }
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