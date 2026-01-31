import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useState } from 'react';

import colors from "@/constants/Colors";

export default function Index() {
  const [grossPay, setGrossPay] = useState('0.00')
  const [netPay, setNetPay] = useState('0.00')

  const [hourlyGross, setHourlyGross] = useState('0.00')
  const [hourlyNet, setHourlyNet] = useState('0.00')
  const [totalIdle, setTotalIdle] = useState('00:00')
  const [totalMiles, setTotalMiles] = useState('0.0')
  const [acceptanceRate, setAcceptanceRate] = useState('0.0')

  return (
    <SafeAreaView>

      <View id="dashboard" style={styles.dashboardWrapper}>
        <Text style={{ 
          alignSelf: 'center',
          color: colors.primary,
          fontWeight: 800,
          fontSize: 45,
          textTransform: 'uppercase',
         }}>Dashboard</Text>
        <View id="main-stats" style={styles.mainStats}>
          <Text id="gross-pay-display" style={styles.grossPay}>Gross: ${grossPay}</Text>
          <Text id="net-pay-display" style={styles.netPay}>${netPay}</Text>
          <Text id="net-pay-label" style={styles.netLabel}>Estimated Net Profit</Text>
        </View>
        <View id="sub-stats" style={styles.subStats}>
          <View id="hourly-gross">
            <Text id="hourly-gross-label" style={styles.label}>Hourly Gross</Text>
            <Text id="hourly-gross-display" style={styles.subStatDisplay}>${hourlyGross}</Text>
          </View>
          <View id="hourly-net">
            <Text id="hourly-net-label" style={styles.label}>Hourly Net</Text>
            <Text id="hourly-net-display" style={styles.subStatDisplay}>${hourlyNet}</Text>
          </View>
          <View id="total-idle">
            <Text id="total-idle-label" style={styles.label}>Total Idle Time</Text>
            <Text id="total-idle-display" style={styles.subStatDisplay}>{totalIdle}</Text>
          </View>
          <View id="total-miles">
              <Text id="total-miles-label" style={styles.label}>Total Miles</Text>
              <Text id="total-miles-display" style={styles.subStatDisplay}>{totalMiles} mi</Text>
          </View>
          <View id="acceptance-rate">
              <Text id="acceptance-rate-label" style={styles.label}>Acceptance Rate</Text>
              <Text id="acceptance-rate-display" style={styles.subStatDisplay}>{acceptanceRate} %</Text>
          </View>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dashboardWrapper: {
    backgroundColor: '#eee',
    padding: 15,
    paddingTop: 10,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#eee',
    borderRadius: 12
  },

  mainStats: {
    // flex: 1,
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
    padding: 10,
    // marginBottom: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#eee',
    borderRadius: 12,
    alignItems: 'center'
  },
  
  grossPay: {
    alignContent: 'center',
    fontSize: 18,
    color: colors.labelText,
  },

  netPay: {
    alignContent: 'center',
    fontSize: 45,
    fontWeight: 800,
    color: colors.net,
    margin: 0,
  },

  netLabel: {
    // alignContent: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.net,
    textTransform: 'uppercase',
    paddingBottom: 10,
  },

  subStats: {
    flex: 1,
    padding: 10,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  subStatDisplay: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  label: {
    display: 'contents',
    fontSize: 10,
    color: colors.labelText,
  }
})

