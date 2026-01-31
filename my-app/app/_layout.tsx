import { Stack } from "expo-router";
import { StyleSheet, View } from 'react-native';

import colors from '@/constants/Colors';

export default function RootLayout() {
  
  return (
    <View style={styles.appBase}>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.dark }
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
  }
})
