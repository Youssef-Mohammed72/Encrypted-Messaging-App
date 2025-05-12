import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions, Platform } from 'react-native';
import colors from '../assets/colors';

const { width, height } = Dimensions.get('window');

// Helper functions for responsive dimensions
const responsiveWidth = (percentage) => (width * percentage) / 100;
const responsiveHeight = (percentage) => (height * percentage) / 100;
const responsiveFont = (size) => {
    const baseScale = width / 375; // 375 is iPhone 11 base width
    const newSize = size * baseScale;
    return Platform.OS === 'ios' ? Math.round(newSize) : Math.round(newSize) - 1;
};

const SplashScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start();

        const timeout = setTimeout(() => {
            navigation.replace('Authentication');
        }, 3000);

        return () => clearTimeout(timeout);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Animated.Image
                source={require('../assets/images/logo.png')}
                style={[
                    styles.logo,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}
            />

            <Animated.Text style={[styles.appName, { opacity: fadeAnim }]}>
                SecureChat
            </Animated.Text>

            <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
                Secure. Private. Encrypted.
            </Animated.Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary || '#2F80ED',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: responsiveWidth(5),
        paddingTop: Platform.OS === 'android' ? 0 : responsiveHeight(2),
    },
    logo: {
        width: responsiveWidth(30),
        height: responsiveWidth(30),
        marginBottom: responsiveHeight(2),
        resizeMode: 'contain',
        borderRadius: responsiveWidth(15),
    },
    appName: {
        fontSize: responsiveFont(28),
        fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
        color: '#FFFFFF',
        fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'Roboto-Bold',
        textAlign: 'center',
    },
    tagline: {
        fontSize: responsiveFont(14),
        color: '#D6D6D6',
        marginTop: responsiveHeight(1),
        fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto-Regular',
        textAlign: 'center',
    },
});

export default SplashScreen;
