import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Notification channels configuration
const CHANNELS = {
  MESSAGES: {
    id: 'messages',
    name: 'Chat Messages',
    sound: 'message_notification.wav',
  },
  CALLS: {
    id: 'calls',
    name: 'Voice/Video Calls',
    sound: 'call_ringtone.wav',
  },
};

// Initialize notification channels
const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNELS.MESSAGES.id, {
      name: CHANNELS.MESSAGES.name,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: CHANNELS.MESSAGES.sound,
    });

    await Notifications.setNotificationChannelAsync(CHANNELS.CALLS.id, {
      name: CHANNELS.CALLS.name,
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      sound: CHANNELS.CALLS.sound,
    });
  }
};

// Notification handler class
class NotificationHandler {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  initialize = async (navigationRef) => {
    await setupNotificationChannels();
    
    // Handle notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      // You can update UI here if needed
    });

    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationNavigation(response, navigationRef);
    });

    // Handle initial notification if app was closed
    this.handleInitialNotification(navigationRef);
  };

  handleInitialNotification = async (navigationRef) => {
    const initialNotification = await Notifications.getLastNotificationResponseAsync();
    if (initialNotification) {
      this.handleNotificationNavigation(initialNotification, navigationRef);
    }
  };

  handleNotificationNavigation = (response, navigationRef) => {
    const { screen, params } = response.notification.request.content.data;
    if (screen && navigationRef.current) {
      navigationRef.current.navigate(screen, params);
    }
  };

  cleanup = () => {
    if (this.notificationListener) this.notificationListener.remove();
    if (this.responseListener) this.responseListener.remove();
  };

  // Notification creators
  createChatNotification = async (message, user) => {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: `New message from ${user.firstName}`,
        body: message.text,
        data: {
          screen: 'Chat',
          params: { chatUser: user },
        },
        sound: CHANNELS.MESSAGES.sound,
        channelId: CHANNELS.MESSAGES.id,
      },
      trigger: null,
    });
  };

  createCallNotification = async (contact, callType = 'audio') => {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: `Incoming ${callType} call`,
        body: `From ${contact.firstName} ${contact.lastName}`,
        data: {
          screen: 'Call',
          params: {
            contactName: `${contact.firstName} ${contact.lastName}`,
            contactImage: contact.image,
            callType,
          },
        },
        sound: CHANNELS.CALLS.sound,
        channelId: CHANNELS.CALLS.id,
      },
      trigger: null,
    });
  };

  // Permission handling
  requestPermissions = async () => {
    if (!Device.isDevice) {
      alert('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  };
}

export default new NotificationHandler();