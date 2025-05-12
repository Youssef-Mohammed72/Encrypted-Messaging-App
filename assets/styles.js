// assets/styles.js
import { StyleSheet } from 'react-native';
import colors from './colors';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Roboto-Bold',
        color: colors.textPrimary,
    },
    text: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: colors.textSecondary,
    },
});

export default styles;
