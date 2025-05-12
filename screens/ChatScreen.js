import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { auth, database } from '../firebase';
import { ref, push, onValue, off, update } from 'firebase/database';
import colors from '../assets/colors';

const { width } = Dimensions.get('window');

const ChatScreen = ({ navigation, route }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const flatListRef = useRef(null);

  // Extract chat user details
  const chatUser = route.params?.chatUser;
  const currentUser = auth.currentUser;

  // Firebase path for this chat’s messages
  const messagesRef = ref(
    database,
    `users/${currentUser.uid}/chats/${chatUser.id}/messages`
  );

  // Load messages in real-time
  useEffect(() => {
    const listener = onValue(messagesRef, snapshot => {
      const msgs = [];
      snapshot.forEach(child => {
        msgs.push({ id: child.key, ...child.val() });
      });
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => off(messagesRef, 'value', listener);
  }, []);

  // Send text message
  const sendMessage = async () => {
    if (!message.trim() || !currentUser) return;

    const newMessage = {
      text:      message,
      senderId:  currentUser.uid,
      timestamp: Date.now(),
      time:      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      await push(messagesRef, newMessage);
      // update chat list preview
      const chatListRef = ref(
        database,
        `users/${currentUser.uid}/chats/${chatUser.id}`
      );
      await update(chatListRef, {
        message: newMessage.text,
        time:    newMessage.time,
        unread:  0,
      });
      setMessage('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Media & location helpers
  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Storage permission is required to pick images');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:   ImagePicker.MediaTypeOptions.Images,
      quality:      0.8,
      allowsEditing:true,
    });
    if (!result.canceled) {
      sendMediaMessage('image', { uri: result.assets[0].uri });
    }
  };

  const handleLocationPress = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required');
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      sendMediaMessage('location', {
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      Alert.alert('Error', 'Could not get your location');
    }
  };

  const sendMediaMessage = async (type, data) => {
    if (!currentUser) return;
    const newMessage = {
      type,
      [type]:    data,
      senderId:  currentUser.uid,
      timestamp: Date.now(),
      time:      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    try {
      await push(messagesRef, newMessage);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleOpenMap = loc => {
    const url = Platform.select({
      ios:     `maps://app?ll=${loc.latitude},${loc.longitude}`,
      android: `geo:${loc.latitude},${loc.longitude}?q=${loc.latitude},${loc.longitude}`,
    });
    Linking.canOpenURL(url)
      .then(supported => supported ? Linking.openURL(url) : Alert.alert('Error', 'Unable to open maps'));
  };

  // Render each message
  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUser.uid;
    return (
      <View style={[styles.messageRow, isMe ? styles.sentRow : styles.receivedRow]}>
        {!isMe && (
          <Image
            source={chatUser.image || require('../assets/images/user1.png')}
            style={styles.profileImage}
          />
        )}
        <View style={[styles.messageBubble, isMe ? styles.sentBubble : styles.receivedBubble]}>
          {item.type === 'image' ? (
            <TouchableOpacity onPress={() => Linking.openURL(item.image.uri)}>
              <Image source={{ uri: item.image.uri }} style={styles.imagePreview} />
              <Text style={[styles.timeText, isMe ? styles.sentTimeText : styles.receivedTimeText]}>
                {item.time}
              </Text>
            </TouchableOpacity>
          ) : item.type === 'location' ? (
            <TouchableOpacity
              onPress={() => handleOpenMap(item.location)}
              style={styles.locationContainer}
            >
              <Icon name="map-pin" size={24} color={isMe ? '#fff' : colors.primary} />
              <Text style={[styles.locationText, isMe && styles.sentLocationText]}>
                Shared Location
              </Text>
              <Text style={[styles.timeText, isMe ? styles.sentTimeText : styles.receivedTimeText]}>
                {item.time}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={[styles.messageText, isMe ? styles.sentText : styles.receivedText]}>
                {item.text}
              </Text>
              <Text style={[styles.timeText, isMe ? styles.sentTimeText : styles.receivedTimeText]}>
                {item.time}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  const firstName = chatUser?.firstName ?? 'Unknown';
  const lastName  = chatUser?.lastName  ?? 'User';

  const handleAudioCall = () => {
    navigation.navigate('CallScreen', {
      callType:     'audio',
      contactName:  `${firstName} ${lastName}`,
      contactImage: chatUser.image,
    });
  };

  const handleVideoCall = () => {
    navigation.navigate('VideoCallScreen', {
      Type:     'video',
      contactName:  `${firstName} ${lastName}`,
      contactImage: chatUser.image,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.backgroundLight} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{firstName}</Text>
          <Text style={styles.headerTitle}>{lastName}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconWrapper} onPress={handleAudioCall}>
            <Icon name="phone" size={20} color={colors.backgroundLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconWrapper} onPress={handleVideoCall}>
            <Icon name="video" size={20} color={colors.backgroundLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        style={styles.messageList}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.iconButton} onPress={handleImagePick}>
            <Icon name="image" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLocationPress}>
            <Icon name="map-pin" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="smile" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Icon name="send" size={20} color={colors.backgroundLight} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.backgroundLight 
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerTitleContainer: { 
    alignItems: 'flex-start', 
    justifyContent: 'center' 
  },
  headerTitle: {
    fontSize: width > 380 ? 28 : 22,
    fontFamily: 'Montserrat-Bold',
    color: colors.backgroundLight,
    lineHeight: 32,
  },
  headerIcons: { 
    flexDirection: 'row' 
  },
  iconWrapper: {
    marginLeft: 15,
    padding: 6,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageList:{ 
    flex: 1, 
    paddingHorizontal: 12, 
    paddingVertical: 10 
  },
  messageRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    marginBottom: 12 
  },
  sentRow: { 
    justifyContent: 'flex-end' 
  },
  receivedRow: { 
    justifyContent: 'flex-start' 
  },
  profileImage: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    marginRight: 8 
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 30,
  },
  sentBubble: { 
    backgroundColor: colors.primary, 
    alignSelf: 'flex-end', 
    borderBottomRightRadius: 5 
  },
  receivedBubble: { 
    backgroundColor: colors.neutral, 
    alignSelf: 'flex-start', 
    borderBottomLeftRadius: 5 
  },
  messageText: { 
    fontSize: width > 380 ? 16 : 14, 
    fontFamily: 'Roboto-Regular' 
  },
  sentText: { 
    color: '#fff' 
  },
  receivedText: { 
    color: '#000' 
  },
  timeText: { 
    fontSize: 12, 
    fontFamily: 'Roboto-Regular', 
    marginTop: 5 
  },
  sentTimeText: { 
    color: 'rgba(255, 255, 255, 0.6)', 
    alignSelf: 'flex-end' 
  },
  receivedTimeText: { 
    color: '#000', 
    alignSelf: 'flex-start' 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
    backgroundColor: '#fff',
  },
  inputWrapper:{
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.neutral,
    borderRadius: 25,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  iconButton: { 
    paddingHorizontal: 6 
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginHorizontal: 4,
  },
  sendButton: {
    marginLeft: 10,
    width: 44,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: { 
    width: width * 0.6, 
    height: 200, 
    borderRadius: 15, 
    marginBottom: 5 
  },
  locationContainer: { 
    alignItems: 'center', 
    padding: 8 
  },
  locationText: { 
    fontSize: 14, 
    fontFamily: 'Roboto-Medium', 
    color: colors.primary, 
    marginVertical: 5 
  },
  sentLocationText: { 
    color: '#fff' 
  },
});
export default ChatScreen;
