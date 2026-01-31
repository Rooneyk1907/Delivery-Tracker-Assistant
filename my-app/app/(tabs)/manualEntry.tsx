import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import OrderEntry from '@/components/orderEntry'

export default function ManualEntry() {
    return(
        <SafeAreaView style={{flex: 1}}>
            <ScrollView 
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 100, // space for floating nav bar
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                <OrderEntry />
            </ScrollView>
        </SafeAreaView>
        )
}