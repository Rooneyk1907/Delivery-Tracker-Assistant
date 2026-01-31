import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import colors from '@/constants/Colors';

export default function TabLayout() {
    return(
        <Tabs
            screenOptions={{
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
                headerShown: false,
            }}
            >
            <Tabs.Screen 
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarButton: (props) => <TabButton {...props} label="Dashboard" icon="stats-chart" iconOutline="stats-chart-outline" />,
                }}/>
            <Tabs.Screen 
                name="liveTracker"
                options={{
                    title: 'Live Tracker',
                    tabBarButton: (props) => <TabButton {...props} label="Live" icon="location" iconOutline="location-outline" />
                }}/>
            <Tabs.Screen 
                name="manualEntry"
                options={{
                    title: "Manual Entry",
                    tabBarButton: (props) => <TabButton {...props} label="Manual" icon="create" iconOutline="create-outline" />
                }}/>
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarButton: (props) => <TabButton {...props} label="History" icon="time" iconOutline="time-outline" />,
                }}/>
        </Tabs>
    );
}

function TabButton ({ accessibilityState, onPress, label, icon, iconOutline, ...rest}: any) {
    const focused = accessibilityState?.selected;
    return(
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={[styles.tabButton, focused && styles.tabButtonActive]}
            {...rest}>
            <View style={styles.tabButtonContent}>
                <Ionicons 
                    name={ focused ? icon : iconOutline }
                    size={ 20 }
                    color={ focused ? '#fff' : colors.labelText }
                    style={{ marginBottom: 4 }} />
                <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        left: 15,
        right: 15,
        bottom: 16,
        height: 66,
        borderRadius: 18,
        backgroundColor: colors.dark,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        paddingHorizontal: 12
    },

    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },

    tabButtonContent: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },

    tabButtonActive: {
        backgroundColor: colors.primary,
        transform: [{ scale: 1.02 }],
    },

    tabLabel: {
        fontSize: 12,
        color: colors.labelText,
        fontWeight: '600',
    },

    tabLabelActive: {
        color: '#fff',
    }
})