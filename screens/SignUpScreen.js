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
import CustomButton from '../components/CustomButton';
import FormInput from '../components/FormInput';
import colors from '../assets/colors';
import { auth, database } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

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

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [secureTextPassword, setSecureTextPassword] = useState(true);
  const [secureTextConfirm, setSecureTextConfirm] = useState(true);

  const [errors, setErrors] = useState({
    username: false,
    email: false,
    password: false,
    confirm: false,
  });

  const handleSignUp = async () => {
    // validation
    const currentErrors = {
      username: !username.trim(),
      email: !validateEmail(email),
      password: password.length < 6,
      confirm: password !== confirmPass,
    };
    setErrors(currentErrors);
    if (Object.values(currentErrors).some((e) => e)) {
      Alert.alert('Invalid Input', 'Please fix the highlighted fields.');
      return;
    }

    try {
      // Check if username exists via REST
      const firebaseDatabaseUrl = database.app.options.databaseURL;
      const usernameCheckUrl = `${firebaseDatabaseUrl}/usernames/${username}.json`;
      const usernameCheckResponse = await fetch(usernameCheckUrl);
      const usernameData = await usernameCheckResponse.json();

      if (usernameData !== null) {
        Alert.alert('Username Taken', 'This username is already in use');
        setErrors((prev) => ({ ...prev, username: true }));
        return;
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      // Save user data with authenticated PUT
      const userDataUrl = `${firebaseDatabaseUrl}/users/${user.uid}.json?auth=${idToken}`;
      await fetch(userDataUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          createdAt: new Date().toISOString(),
        }),
      });

      const usernameSaveUrl = `${firebaseDatabaseUrl}/usernames/${username}.json?auth=${idToken}`;
      await fetch(usernameSaveUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user.uid),
      });

      Alert.alert('Success', 'Account created successfully!');
      navigation.replace('Authentication');
    } catch (error) {
      Alert.alert('Sign Up Error', error.message);
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
          <Text style={styles.signUpTitle}>Create an Account</Text>

          <FormInput
            icon="user"
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setErrors((prev) => ({ ...prev, username: false }));
            }}
            error={errors.username}
          />

          <FormInput
            icon="mail"
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => ({ ...prev, email: false }));
            }}
            error={errors.email}
          />

          <FormInput
            icon="lock"
            placeholder="Password"
            secureTextEntry={secureTextPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: false }));
            }}
            error={errors.password}
          />
          <TouchableOpacity
            onPress={() => setSecureTextPassword(!secureTextPassword)}
            style={[styles.toggleSecure, { top: responsiveHeight(24.5) }]}
          >
            <Icon
              name={secureTextPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          <FormInput
            icon="lock"
            placeholder="Confirm Password"
            secureTextEntry={secureTextConfirm}
            value={confirmPass}
            onChangeText={(text) => {
              setConfirmPass(text);
              setErrors((prev) => ({ ...prev, confirm: false }));
            }}
            error={errors.confirm}
          />
          <TouchableOpacity
            onPress={() => setSecureTextConfirm(!secureTextConfirm)}
            style={[styles.toggleSecure, { top: responsiveHeight(30.5) }]}
          >
            <Icon
              name={secureTextConfirm ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          <CustomButton
            title="SIGN UP"
            onPress={handleSignUp}
            style={styles.signUpButton}
          />

          <View style={styles.signInLinkContainer}>
            <Text style={styles.signUpText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.signUpLink}> Sign In from here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SignUpScreen;

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
  signUpTitle: {
    fontSize: responsiveFont(20),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: responsiveHeight(5),
  },
  toggleSecure: {
    position: 'absolute',
    right: responsiveWidth(10),
  },
  signUpButton: {
    width: '90%',
    borderRadius: responsiveWidth(6),
  },
  signInLinkContainer: {
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
