import colors from '@/constants/Colors';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface CurrencyInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    onBlur?: () => void;
    placeholder?: string;
};

export default function CurrencyInput({ label, value, onChangeText, onBlur, placeholder = '0.00'}: CurrencyInputProps) {

        const formatCurrencyInput = (text: string) => {
            let formatted = text.replace(/[^0-9.]/g, '');
            const parts = formatted.split('.');
            if (parts.length > 2) formatted = parts [0] + '.' + parts.slice(1).join('');
            const integer = formatted.split('.')[0] || '0';
            const fractional = formatted.split('.')[1] ?? '';
            if (formatted.endsWith('.')) return `${integer}.`;
            const fracLimited = fractional.slice(0, 2);
            return fracLimited ? `${integer}.${fracLimited}` : integer;
        };
    
        const formatTwoDecimals = (val: string) => {
            const n = parseFloat(val);
            return isNaN(n) ? '' : n.toFixed(2);
        }

        return (
            <View style={styles.container}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={(t) => onChangeText(formatCurrencyInput(t))}
                    onBlur={() => onBlur?.() || onChangeText(formatTwoDecimals(value))}
                    placeholder={placeholder}
                    />
            </View>
        )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        marginBottom: 12,
    },

    label: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.labelText,
        marginBottom: 6,
        textTransform: 'uppercase',
    },

    input: {
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        color: colors.dark,
    }
})