import { Stack } from "expo-router";
import { StyleSheet, View } from 'react-native';

import colors from '@/constants/Colors';

export default function RootLayout() {
  console.log(colors.dark);
  
  return (
    <View style={styles.appBase}>
          <Stack screenOptions={{ headerShown: false,
                                  contentStyle: { backgroundColor: styles.appBase.backgroundColor }
                                  }} />
    </View>
  );
}

const styles = StyleSheet.create({
  appBase: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    alignContent: 'center',
    margin: 0,
    padding: 15,
    paddingBottom: 70,
    backgroundColor: colors.dark,
    fontFamily: 'sans-serif',
  }
})
