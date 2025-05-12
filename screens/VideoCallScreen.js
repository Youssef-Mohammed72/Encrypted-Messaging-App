import React, { useEffect, useState } from 'react';
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
import { Camera } from 'expo-camera';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Feather';
import colors from '../assets/colors';
import { RFValue } from 'react-native-responsive-fontsize';
import NotificationHandler from '../utils/NotificationHandler';

const VideoCallScreen = ({ navigation, route }) => {
  const { width, height } = useWindowDimensions();
  const {
    contactName = 'Shane Martinez',
    contactImage = require('../assets/images/user1.png'),
    callType,
  } = route.params || {};

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [cameraType, setCameraType] = useState('front');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('[VideoCallScreen] camera permission:', status);
      setHasCameraPermission(status === 'granted');
    })();
  }, []);

  const toggleCameraType = () =>
    setCameraType(current => {
      const next = current === 'front' ? 'back' : 'front';
      console.log('[VideoCallScreen] camera toggled to', next);
      return next;
    });

  const handleCallPress = async (type) => {
    const [firstName, lastName] = contactName.split(' ');
    await NotificationHandler.createCallNotification(
      { firstName, lastName, image: contactImage },
      type
    );
    navigation.navigate('Call', { callType: type, contactName, contactImage });
  };

  if (hasCameraPermission === null) return <View />;
  if (hasCameraPermission === false) return <Text>No camera access</Text>;

  return (
    <View style={styles.container}>
      {/* Background layer: either Camera or blurred Image */}
      <View style={[StyleSheet.absoluteFill, { width, height }]}>
        {callType === 'video' ? (
          <>
            {console.log('[VideoCallScreen] rendering Camera type=', cameraType)}
            <Camera
              style={StyleSheet.absoluteFill}
              type={
                cameraType === 'front'
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              }
            />
          </>
        ) : (
          <ImageBackground
            source={contactImage}
            style={StyleSheet.absoluteFill}
            blurRadius={Platform.OS === 'android' ? 15 : 0}
          >
            {Platform.OS === 'ios' && (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType="dark"
                blurAmount={20}
              />
            )}
          </ImageBackground>
        )}
      </View>

      {/* Overlay: Profile info */}
      <View style={[styles.profileContainer, { bottom: height * 0.4 }]}>
        <Image
          source={contactImage}
          style={[
            styles.profileImage,
            { width: width * 0.3, height: width * 0.3, borderRadius: width * 0.15 },
          ]}
        />
        <Text style={[styles.callingText, { fontSize: RFValue(16, height) }]}>
          {callType === 'video' ? 'Video Call' : 'Calling'}
        </Text>
        <Text style={[styles.contactName, { fontSize: RFValue(26, height) }]}>
          {contactName}
        </Text>
      </View>

      {/* Overlay: Controls */}
      <View style={[styles.buttonContainer, { width: width * 0.8, bottom: height * 0.1 }]}>
        <View style={styles.controlButtonWrapper}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {}}
          >
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

        {/* Always show camera toggle */}
        <View style={styles.controlButtonWrapper}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={toggleCameraType}
          >
            <Icon name="repeat" size={RFValue(26, height)} color={colors.iconColor} />
          </TouchableOpacity>
          <Text style={styles.controlText}>Switch</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    marginBottom: 60
  },
  profileImage: { marginBottom: 15, resizeMode: 'cover' },
  callingText: { color: colors.textPrimary, marginBottom: 5 },
  contactName: {
    fontFamily: 'Montserrat-Bold',
    fontWeight: 'bold',
    color: colors.neutral,
  },
  buttonContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'center',
    alignItems: 'center',
  },
  controlButtonWrapper: { alignItems: 'center' },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    marginBottom: 50,
    backgroundColor: 'red',
    padding: 22,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.2)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default VideoCallScreen;
