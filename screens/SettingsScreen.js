import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Switch,
    Platform,
    Dimensions,
    Alert
} from 'react-native';
import colors from '../assets/colors';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const { width } = Dimensions.get('window');

const SettingsScreen = ({ navigation }) => {
    const [isNewMatchEnabled, setIsNewMatchEnabled] = useState(true);
    const [isNewMessageEnabled, setIsNewMessageEnabled] = useState(true);
    const [isShowPreviewEnabled, setIsShowPreviewEnabled] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigation.replace('Authentication');
        } catch (error) {
            Alert.alert('Logout Error', error.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Matching Preferences Section */}
                <Text style={styles.sectionTitle}>Matching Preferences</Text>
                <View style={styles.section}>
                    <TouchableOpacity style={styles.option}>
                        <Text style={styles.optionText}>Location</Text>
                        <Text style={styles.optionValue}>South Jakarta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.option}>
                        <Text style={styles.optionText}>Target Gender</Text>
                        <Text style={styles.optionValue}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.option}>
                        <Text style={styles.optionText}>Target Age Range</Text>
                        <Text style={styles.optionValue}>26 - 35</Text>
                    </TouchableOpacity>
                </View>

                {/* Notifications Section */}
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.section}>
                    <View style={styles.option}>
                        <Text style={styles.optionText}>New Match</Text>
                        <Switch
                            value={isNewMatchEnabled}
                            onValueChange={setIsNewMatchEnabled}
                        />
                    </View>
                    <View style={styles.option}>
                        <Text style={styles.optionText}>New Message</Text>
                        <Switch
                            value={isNewMessageEnabled}
                            onValueChange={setIsNewMessageEnabled}
                        />
                    </View>
                    <View style={styles.option}>
                        <Text style={styles.optionText}>Show Message Preview</Text>
                        <Switch
                            value={isShowPreviewEnabled}
                            onValueChange={setIsShowPreviewEnabled}
                        />
                    </View>
                </View>

                {/* Others Section */}
                <Text style={styles.sectionTitle}>Others</Text>
                <View style={styles.section}>
                    <TouchableOpacity style={styles.option}>
                        <Text style={styles.optionText}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.option}>
                        <Text style={styles.optionText}>Terms & Conditions</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral || '#F5F5F5',
    },
    header: {
        height: Platform.OS === 'ios' ? 140 : 120,
        backgroundColor: colors.primary || '#4A90E2',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        marginHorizontal: 16,
        paddingBottom: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 16,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: width > 380 ? 32 : 26,
        fontFamily: 'Montserrat-Bold',
        fontWeight: 'bold',
        color: colors.backgroundLight,
        textAlign: 'center',
    },
    scrollContainer: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: width > 380 ? 18 : 16,
        fontFamily: 'Montserrat-Bold',
        color: colors.textPrimary || '#000',
        marginBottom: 12,
        marginTop: 20,
        paddingHorizontal: 4,
    },
    section: {
        backgroundColor: colors.backgroundLight,
        borderRadius: 12,
        padding: width > 400 ? 18 : 14,
        marginBottom: 16,
        shadowColor: colors.backgroundDark,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.neutral || '#E0E0E0',
    },
    optionText: {
        fontSize: width > 380 ? 16 : 14,
        fontFamily: 'Inter',
        color: colors.textPrimary || '#000',
    },
    optionValue: {
        fontSize: width > 380 ? 16 : 14,
        fontFamily: 'Inter',
        color: colors.textSecondary || '#777',
    },
    logoutButton: {
        alignSelf: 'center',
        marginVertical: 20,
    },
    logoutText: {
        fontSize: width > 380 ? 18 : 16,
        fontFamily: 'Montserrat-Bold',
        color: colors.danger || '#4A90E2',
    },
});

export default SettingsScreen;
