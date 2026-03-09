import { StyleSheet } from 'react-native';

import colors from '@/constants/Colors';

export const uStyle = StyleSheet.create({
	heading: {
		alignSelf: 'center',
		color: colors.labelText,
		fontWeight: '800',
		textTransform: 'uppercase',
		marginBottom: 16,
	},
});
