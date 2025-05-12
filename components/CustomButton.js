// components/CustomButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../assets/colors';
const CustomButton = ({ onPress, title, style, textStyle }) => (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
        <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
);
const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
        text: {
        color: colors.backgroundLight,
        fontSize: 16,
        fontFamily: 'Roboto-Bold',
    },
});
export default CustomButton;