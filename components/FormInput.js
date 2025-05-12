import React from 'react';
import { View, TextInput, StyleSheet, Text, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import colors from '../assets/colors';

const FormInput = ({
    icon,
    placeholder,
    secureTextEntry,
    value,
    onChangeText,
    error,
}) => {
    return (
        <View style={[styles.inputWrapper, error && styles.errorBorder]}>
            <Icon name={icon} size={20} color={colors.primary} style={styles.icon} />
            <TextInput
                placeholder={placeholder}
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F6F6F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'Roboto',
    },
    icon: {
        marginRight: 10,
    },
    errorBorder: {
        borderColor: 'red',
    },
});

export default FormInput;
