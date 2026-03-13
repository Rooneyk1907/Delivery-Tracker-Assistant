import {View, Text, FlatList, TouchableOpacity} from 'react-native';
import { useState, useEffect } from 'react'

import {WorkDay} from '@/types/workday'

import { workDay } from '@/hooks/useStorage'; 

const rangeSelections = [
    {
        id: 'today',
        title: 'Today',
    },
    {
        id: 'prev7Days',
        title: 'Previous 7 Days'
    },
    {
        id: 'thisMonth',
        title: 'This Month'
    },
    {
        id: 'prevMonthRolling',
        title: 'Past Month', // to previous month, same day i.e. today is 2-23, prev month is 1-23
    },
    {
        id: 'prevMonthCalendar',
        title: 'Previous Month'
    },
    {
        id: 'yearToDate',
        title: 'Year to Date'
    },
    {
        id: 'prevYear',
        title: 'Previous Year',
    }
]

type RangeItem = {
    id: string,
    title: string,
};

type ItemProps = {
    item: RangeItem
    onPress: (item: RangeItem) => void
}

const Item = ({item, onPress}: ItemProps) => (
    <TouchableOpacity onPress={() => onPress(item)}>
        <Text>{item.title}</Text>
    </TouchableOpacity>
)

export default function FilterSelector() {
    const [selectedRange, setSelectedRange] = useState<string>('today')
    const [workDays, setWorkDays] = useState<WorkDay []>()
    const [filteredDays, setFilteredDays] = useState()
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const dayStore = workDay();
    const { loadAll } = dayStore;

    // const today = new Date()
    // today.setMonth(0, 1)
    // console.log(today)

    useEffect(() => {
        (async () => {
            const workDays = await loadAll();

            if (workDays && selectedRange) {
                const filteredDays = filterDatesByPreset(workDays, selectedRange)

                setIsLoading(false)
                setWorkDays(workDays)
                setFilteredDays(filteredDays)
            }
        }) ();
    }, [selectedRange, isLoading])

    function handlePress(item: any) {
        setSelectedRange(item.id)
        console.log(`pressed item: ${item.id}`)
    }

    // converts input to a new Date(value)
    function toDate(value: any) {
        return value instanceof Date ? value : new Date(value);
    }

    function startOfDay(day: string | number | Date) {
        const startDay = new Date(day);
        startDay.setHours(0, 0, 0, 0);
        return startDay
    }

    function endOfDay(day: string | number | Date) {
        const endDay = new Date(day);
        endDay.setHours(23, 59, 59, 999)
        return endDay
    }

    function getRangeByPreset (preset: string, now = new Date()) {
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        let start;
        let end = todayEnd;

        switch(preset) {
            case "today" : {
                start = todayStart;
                break;
            }

            case 'prev7Days' : {
                start = new Date(todayStart);
                start.setDate(start.getDate() - 6) // includes today
                break;
            }
            
            case 'thisMonth' : {
                start = new Date(todayStart);
                start.setMonth(start.getMonth(), 1)
            }

            case 'prevMonthRolling' : {
                start = new Date(todayStart);
                start.setMonth(start.getMonth() - 1);
                break
            }

            case 'prevMonthCalendar': {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
                break
            }

            case 'yearToDate' : {
                start = new Date(todayStart);
                start.setMonth(0, 1)
                break;
            }

            case 'prevYear': {
                const year = now.getFullYear() - 1;
                start = new Date(year, 0, 1, 0, 0, 0, 0);
                end = new Date(year, 11, 31, 23, 59, 59, 999);
                break
            }

            default: 
                throw new Error(`Unknown preset: ${preset}`)
        }

        return {start, end}
    }


    function filterDatesByPreset(dates: any, preset: string, now = new Date()) {
        const {start, end} = getRangeByPreset(preset, now);
        const startTime = start.getTime();
        const endTime = end.getTime();

        console.log(`workDays: ${workDays}`)
        console.log(`dates: ${dates}`)

        return dates.map(toDate).filter((day: any) => {
            const time = day.getTime();
            return time >= startTime && time <= endTime;
        })

    }

    console.log(filteredDays)
    console.log(`isLoading: ${isLoading}`)
    return (
        <View>
            <Text>
                Filter Selector
            </Text>

            { isLoading ? (
                <View>
                    <Text>
                        Loading...
                    </Text>
                </View>
            ) : (<>
            
            <FlatList 
                data={rangeSelections}
                renderItem={({item}) => <Item item={item} onPress={handlePress} />}
                keyExtractor={item => item.id}
                
                />
                </>)}
        </View>
    )
}
