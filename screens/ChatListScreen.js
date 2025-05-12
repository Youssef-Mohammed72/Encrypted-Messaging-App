import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Swipeable } from 'react-native-gesture-handler';
import colors from '../assets/colors';
import CustomButton from '../components/CustomButton';
import { auth, database } from '../firebase';
import { ref, onValue, push, remove, set } from 'firebase/database';

const { width } = Dimensions.get('window');
const scale = width / 375;
const scaledSize = size => Math.round(size * scale);

const ChatListScreen = ({ navigation }) => {
  const [chatData, setChatData] = useState([]);
  const [filteredChatData, setFilteredChatData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChat, setNewChat] = useState({
    firstName: '',
    lastName: '',
    message: '',
    image: require('../assets/images/user1.png'),
  });

  // Fetch chats from Firebase
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const chatsRef = ref(database, `users/${user.uid}/chats`);
    const unsubscribe = onValue(chatsRef, snapshot => {
      const chats = [];
      snapshot.forEach(childSnapshot => {
        chats.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
      setChatData(chats);
    });

    return () => unsubscribe();
  }, []);

  // Filter logic whenever chatData or searchQuery changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChatData(chatData);
    } else {
      const lower = searchQuery.toLowerCase();
      const filtered = chatData.filter(chat => {
        const fullName = `${chat.firstName} ${chat.lastName}`.toLowerCase();
        const message = chat.message.toLowerCase();
        return fullName.includes(lower) || message.includes(lower);
      });
      setFilteredChatData(filtered);
    }
  }, [searchQuery, chatData]);

  const handleInputChange = (field, value) => {
    setNewChat(prev => ({ ...prev, [field]: value }));
  };

  // Modified createNewChat to remove manual ID generation
  const createNewChat = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (!newChat.firstName.trim() || !newChat.lastName.trim()) {
        Alert.alert('Error', 'Please enter both first and last name');
        return;
      }

      // Prepare chat entry
      const chatEntry = {
        ...newChat,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: 1,
        online: true,
      };

      // Push to chats and let Firebase generate the key
      const userChatsRef = ref(database, `users/${user.uid}/chats`);
      const newChatRef = push(userChatsRef);
      await set(newChatRef, chatEntry);

      // Reset state
      setNewChat({
        firstName: '',
        lastName: '',
        message: '',
        image: require('../assets/images/user1.png'),
      });
      setShowNewChatModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create new chat: ' + error.message);
    }
  };

  // Delete confirmation and handler
  const handleDeleteConfirmation = chatId => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteChat(chatId), style: 'destructive' }
      ]
    );
  };

  const deleteChat = async chatId => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const chatRef = ref(database, `users/${user.uid}/chats/${chatId}`);
      await remove(chatRef);
    } catch (error) {
      Alert.alert('Error', `Couldn't delete chat: ${error.message}`);
    }
  };

  // Render each chat item with swipe-to-delete
  const renderItem = ({ item }) => (
    <Swipeable
      containerStyle={styles.swipeableContainer}
      friction={2}
      rightThreshold={40}
      renderRightActions={() => (
        <View style={styles.deleteContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteConfirmation(item.id)}
          >
            <Icon name="trash-2" size={scaledSize(20)} color={colors.backgroundLight} />
          </TouchableOpacity>
        </View>
      )}
    >
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate('Chat', {
            chatUser: {
              id: item.id,
              firstName: item.firstName,
              lastName: item.lastName,
              image: item.image,
            },
          })
        }
      >
        <View style={styles.profileWrapper}>
          <Image source={item.image} style={styles.profileImage} />
          {item.online && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.chatDetails}>
          <Text style={styles.name} numberOfLines={1}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.message} numberOfLines={1}>
            {item.message}
          </Text>
        </View>
        <View style={styles.chatMeta}>
          <Text style={styles.time}>{item.time}</Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  // Header content with toggleable search bar
  const headerContent = () => (
    <View style={styles.header}>
      {isSearching ? (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats..."
            placeholderTextColor={colors.backgroundLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity
            onPress={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
          >
            <Icon name="x" size={scaledSize(22)} color={colors.backgroundLight} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Chats</Text>
          <TouchableOpacity onPress={() => setIsSearching(true)}>
            <Icon name="search" size={scaledSize(22)} color={colors.backgroundLight} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* New Chat Modal */}
      <Modal
        visible={showNewChatModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Chat</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                value={newChat.firstName}
                onChangeText={t => handleInputChange('firstName', t)}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                value={newChat.lastName}
                onChangeText={t => handleInputChange('lastName', t)}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Initial Message</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter initial message"
                value={newChat.message}
                onChangeText={t => handleInputChange('message', t)}
                multiline
              />
            </View>
            <View style={styles.modalButtonContainer}>
              <CustomButton
                title="Cancel"
                onPress={() => setShowNewChatModal(false)}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
              <CustomButton
                title="Create Chat"
                onPress={createNewChat}
                style={styles.createButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Header */}
      {headerContent()}

      {/* Chat List */}
      <FlatList
        data={filteredChatData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching chats found' : 'No chats found'}
            </Text>
            {!searchQuery && (
              <Text style={styles.emptySubtext}>Tap '+' to start a new chat</Text>
            )}
          </View>
        }
      />

      {/* FAB */}
      <CustomButton
        title="+"
        onPress={() => setShowNewChatModal(true)}
        style={styles.fab}
        textStyle={styles.fabText}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => alert('Chats')}>
          <Icon name="message-circle" size={scaledSize(24)} color={colors.primary} />
          <Text style={styles.navText}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => alert('Calls')}>
          <Icon name="phone" size={scaledSize(24)} color={colors.textSecondary} />
          <Text style={styles.navTextInactive}>Calls</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="settings" size={scaledSize(24)} color={colors.textSecondary} />
          <Text style={styles.navTextInactive}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral },

  // Header & Search
  header: {
    backgroundColor: colors.primary,
    paddingVertical: scaledSize(20),
    paddingHorizontal: scaledSize(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: scaledSize(25),
    borderBottomRightRadius: scaledSize(25),
    marginHorizontal: scaledSize(16),
    marginBottom: scaledSize(12),
  },
  title: {
    fontSize: scaledSize(38),
    fontFamily: 'Montserrat-Bold',
    fontWeight: 'bold',
    color: colors.backgroundLight,
    paddingTop: scaledSize(50),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: colors.backgroundLight,
    fontSize: scaledSize(18),
    marginRight: scaledSize(10),
    paddingVertical: scaledSize(5),
  },

  // Chat Item
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaledSize(12),
    paddingHorizontal: scaledSize(15),
    marginVertical: scaledSize(4),
    backgroundColor: colors.backgroundLight,
    borderRadius: scaledSize(15),
    borderWidth: 1,
    borderColor: colors.neutral,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileWrapper: {
    position: 'relative',
    marginRight: scaledSize(12),
  },
  profileImage: {
    width: scaledSize(50),
    height: scaledSize(50),
    borderRadius: scaledSize(25),
  },
  onlineIndicator: {
    width: scaledSize(12),
    height: scaledSize(12),
    backgroundColor: colors.secondary,
    borderRadius: scaledSize(6),
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: colors.backgroundLight,
  },
  chatDetails: { 
    flex: 1 
  },
  name: {
    fontSize: scaledSize(18),
    fontFamily: 'Montserrat-Bold',
    color: colors.textPrimary,
  },
  message: {
    fontSize: scaledSize(14),
    fontFamily: 'Roboto-Regular',
    color: colors.textSecondary,
  },
  chatMeta: { 
    alignItems: 'flex-end' 
  },
  time: {
    fontSize: scaledSize(12),
    fontFamily: 'Roboto-Regular',
    color: colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    width: scaledSize(20),
    height: scaledSize(20),
    borderRadius: scaledSize(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaledSize(5),
  },
  unreadText: {
    fontSize: scaledSize(12),
    fontFamily: 'Roboto-Bold',
    color: colors.backgroundLight,
  },

  // Swipe & Delete
  swipeableContainer: {
    marginHorizontal: scaledSize(16),
  },
  deleteContainer: {
    backgroundColor: colors.danger,
    width: scaledSize(80),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scaledSize(15),
    marginVertical: scaledSize(3),
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // FAB & Bottom Nav
  fab: {
    position: 'absolute',
    right: scaledSize(20),
    bottom: scaledSize(80),
    backgroundColor: colors.primary,
    width: scaledSize(60),
    height: scaledSize(60),
    borderRadius: scaledSize(30),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  fabText: {
    fontSize: scaledSize(24),
    fontFamily: 'Montserrat-Bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: scaledSize(70),
    backgroundColor: colors.backgroundLight,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: scaledSize(15),
    borderTopRightRadius: scaledSize(15),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  navItem: { 
    alignItems: 'center' 
  },
  navText: {
    fontSize: scaledSize(12),
    fontFamily: 'Roboto-Bold',
    color: colors.primary,
  },
  navTextInactive: {
    fontSize: scaledSize(12),
    fontFamily: 'Roboto-Regular',
    color: colors.textSecondary,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: scaledSize(20),
    borderRadius: scaledSize(15),
    padding: scaledSize(20),
  },
  modalTitle: {
    fontSize: scaledSize(20),
    fontFamily: 'Montserrat-Bold',
    color: colors.primary,
    marginBottom: scaledSize(20),
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: scaledSize(15),
  },
  inputLabel: {
    fontSize: scaledSize(14),
    color: colors.textPrimary,
    marginBottom: scaledSize(5),
  },
  input: {
    backgroundColor: colors.neutral,
    borderRadius: scaledSize(8),
    padding: scaledSize(10),
    fontSize: scaledSize(16),
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaledSize(20),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral,
    marginRight: scaledSize(10),
  },
  cancelButtonText: {
    color: colors.textPrimary,
  },
  createButton: {
    flex: 1,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaledSize(100),
  },
  emptyText: {
    fontSize: scaledSize(18),
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: scaledSize(14),
    color: colors.textSecondary,
    marginTop: scaledSize(10),
  },
});

export default ChatListScreen;
