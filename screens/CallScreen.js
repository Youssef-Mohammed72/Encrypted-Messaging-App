import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Feather';
import colors from '../assets/colors';
import { RFValue } from 'react-native-responsive-fontsize';
import NotificationHandler from '../utils/NotificationHandler';

const CallScreen = ({ navigation, route }) => {
  const { width, height } = useWindowDimensions();
  const {
    contactName = 'Shane Martinez',
    contactImage = require('../assets/images/user1.png'),
  } = route.params || {};

  const handleCallPress = async (type) => {
    const contact = {
      firstName: contactName.split(' ')[0],
      lastName: contactName.split(' ')[1],
      image: contactImage,
    };

    await NotificationHandler.createCallNotification(contact, type);
    navigation.navigate('VideoCallScreen', { 
      contactName, 
      contactImage,
      Type: 'video' 
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={contactImage}
        style={[styles.backgroundImage, { width, height }]}
        blurRadius={Platform.OS === 'android' ? 15 : 0}
      >
        {Platform.OS === 'ios' && (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={20}
          />
        )}

        <View style={[styles.profileContainer, { marginBottom: height * 0.2 }]}>
          <Image
            source={contactImage}
            style={[
              styles.profileImage,
              { width: width * 0.3, height: width * 0.3, borderRadius: width * 0.15 },
            ]}
          />
          <Text style={[styles.callingText, { fontSize: RFValue(16, height) }]}>
            Calling
          </Text>
          <Text style={[styles.contactName, { fontSize: RFValue(26, height) }]}>
            {contactName}
          </Text>
        </View>

        <View style={[styles.buttonContainer, { width: width * 0.8, bottom: height * 0.07 }]}>
          <View style={styles.controlButtonWrapper}>
            <TouchableOpacity style={styles.controlButton} onPress={() => {}}>
              <Icon name="volume-2" size={RFValue(26, height)} color={colors.iconColor} />
            </TouchableOpacity>
            <Text style={styles.controlText}>Speaker</Text>
          </View>

          <TouchableOpacity
            style={styles.endCallButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="phone" size={RFValue(30, height)} color="#fff" />
          </TouchableOpacity>

          <View style={styles.controlButtonWrapper}>
            <TouchableOpacity style={styles.controlButton} onPress={() => handleCallPress('video')}>
              <Icon name="video" size={RFValue(26, height)} color={colors.iconColor} />
            </TouchableOpacity>
            <Text style={styles.controlText}>Video</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: { alignItems: 'center' },
  profileImage: { marginBottom: 15, resizeMode: 'cover' },
  callingText: { color: colors.textPrimary, marginBottom: 5 },
  contactName: {
    fontFamily: 'Montserrat-Bold',
    fontWeight: 'bold',
    color: colors.neutral,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
  },
  controlButtonWrapper: { alignItems: 'center' },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    borderRadius: 50,
  },
  controlText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 8,
    fontWeight: '600',
  },
  endCallButton: {
    backgroundColor: 'red',
    padding: 22,
    marginBottom: 50,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default CallScreen;