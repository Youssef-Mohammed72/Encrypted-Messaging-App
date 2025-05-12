import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as Device from 'expo-device';
import NotificationHandler from '../utils/NotificationHandler';
import CustomButton from '../components/CustomButton';
import FormInput from '../components/FormInput';
import colors from '../assets/colors';
import { auth, database } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

const responsiveWidth = (percentage) => (width * percentage) / 100;
const responsiveHeight = (percentage) => (height * percentage) / 100;
const responsiveFont = (size) => {
  const scale = width / 375;
  const newSize = size * scale;
  return Platform.OS === 'ios' ? Math.round(newSize) : Math.round(newSize) - 1;
};

const validateEmail = (email) =>
  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);

const AuthenticationScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [errors, setErrors] = useState({ username: false, password: false });

  const handleLogin = async () => {
    // 1) Validate inputs
    let valid = true;
    const newErrors = { username: false, password: false };

    if (!username.trim()) {
      newErrors.username = true;
      valid = false;
    }
    if (password.length < 6) {
      newErrors.password = true;
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) {
      Alert.alert('Invalid Input', 'Please fix the highlighted fields.');
      return;
    }

    try {
      let emailToUse = username;

      // If input is not an email, look up username via REST API
      if (!validateEmail(username)) {
        const firebaseDatabaseUrl = database.app.options.databaseURL;
        const usernameCheckUrl = `${firebaseDatabaseUrl}/usernames/${username}.json`;
        
        const usernameResponse = await fetch(usernameCheckUrl);
        const userId = await usernameResponse.json();

        if (!userId) {
          Alert.alert('Invalid Credentials', 'Username not found');
          return;
        }

        const userUrl = `${firebaseDatabaseUrl}/users/${userId}.json`;
        const userResponse = await fetch(userUrl);
        const userData = await userResponse.json();

        if (!userData || !userData.email) {
          Alert.alert('Invalid Credentials', 'User data is incomplete');
          return;
        }

        emailToUse = userData.email;
      }

      // Sign in with email and password
      await signInWithEmailAndPassword(auth, emailToUse, password);

      // 2) Notification permission flow
      Alert.alert(
        'Allow Notifications?',
        'Our app would like to send you notifications.',
        [
          {
            text: "Don't Allow",
            style: 'cancel',
            onPress: () => {
              navigation.replace('ChatList');
            },
          },
          {
            text: 'Allow',
            onPress: async () => {
              // Bypass emulator/simulator
              if (!Device.isDevice) {
                return navigation.replace('ChatList');
              }

              const hasPermission = await NotificationHandler.requestPermissions();
              if (!hasPermission) {
                Alert.alert(
                  'Notifications blocked',
                  'Some features may not work properly'
                );
              }
              navigation.replace('ChatList');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Curved Header */}
        <View style={styles.headerCurve}>
          <Image
            source={require('../assets/images/background.png')}
            style={styles.headerBackground}
          />
        </View>

        {/* Form Area */}
        <View style={styles.formContainer}>
          <Text style={styles.signInTitle}>Sign In Now</Text>

          {/* Username / Email Input */}
          <FormInput
            icon="user"
            placeholder="Username or Email"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setErrors((prev) => ({ ...prev, username: false }));
            }}
            error={errors.username}
          />

          {/* Password Input */}
          <FormInput
            icon="lock"
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: false }));
            }}
            secureTextEntry={secureText}
            error={errors.password}
          />

          {/* Show/Hide Password Icon */}
          <TouchableOpacity
            onPress={() => setSecureText(!secureText)}
            style={styles.toggleSecure}
          >
            <Icon name={secureText ? 'eye-off' : 'eye'} size={20} color="#666" />
          </TouchableOpacity>

          {/* Remember Me & Forgot Password */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={styles.checkbox}>
                {rememberMe && <Icon name="check" size={14} color={colors.primary} />}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => Alert.alert('Forgot Password?')}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <CustomButton
            title="SIGN IN"
            onPress={handleLogin}
            style={styles.signInButton}
          />

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don’t have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}> Sign Up from here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default AuthenticationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  headerCurve: {
    height: responsiveHeight(30),
    borderBottomLeftRadius: responsiveWidth(8),
    borderBottomRightRadius: responsiveWidth(8),
    marginHorizontal: responsiveWidth(4),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  formContainer: {
    flex: 1,
    marginTop: responsiveHeight(5),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: responsiveWidth(10),
    borderTopRightRadius: responsiveWidth(10),
    padding: responsiveWidth(5),
    alignItems: 'center',
  },
  signInTitle: {
    fontSize: responsiveFont(20),
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'Montserrat-Bold',
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: responsiveHeight(5),
  },
  toggleSecure: {
    position: 'absolute',
    right: responsiveWidth(10),
    top: responsiveHeight(18),
  },
  row: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: responsiveHeight(6),
    marginTop: 10,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: responsiveWidth(1.5),
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: responsiveFont(14),
    color: '#666666',
  },
  forgotPassword: {
    fontSize: responsiveFont(14),
    color: colors.textSecondary,
  },
  signInButton: {
    width: '90%',
    borderRadius: responsiveWidth(6),
  },
  signUpContainer: {
    alignItems: 'center',
    marginTop: responsiveHeight(4),
  },
  signUpText: {
    color: colors.textSecondary,
    fontSize: responsiveFont(16),
  },
  signUpLink: {
    fontWeight: 'bold',
    fontSize: responsiveFont(16),
    color: colors.primary,
  },
});
