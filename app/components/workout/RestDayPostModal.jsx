import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '../../hooks/useThemeColors';
import { createPost } from '../../api/postsApi';
import { uploadImage } from '../../api/storageApi';
import { useAuth } from '../../auth/auth';
import { storage, calculateStreakFromLocal, markTodayCompleted } from '../../../storage';
import { preparePostImage } from '../../utils/imageUpload';
import TagUsersModal from '../post/TagUsersModal';
import { createTagNotification } from '../../api/notificationsApi';

const REST_ACTIVITIES = [
  { id: 'walk', label: 'Walk', icon: 'walk-outline' },
  { id: 'stretch', label: 'Stretch', icon: 'body-outline' },
  { id: 'mobility', label: 'Mobility', icon: 'fitness-outline' },
  { id: 'yoga', label: 'Yoga', icon: 'flower-outline' },
  { id: 'sauna', label: 'Sauna', icon: 'flame-outline' },
  { id: 'massage', label: 'Massage', icon: 'hand-left-outline' },
  { id: 'sleep', label: 'Sleep', icon: 'bed-outline' },
  { id: 'mental', label: 'Mental Reset', icon: 'happy-outline' },
];

const RestDayPostModal = ({ visible, onClose, onPostCreated, splitName, splitEmoji, weekNumber, dayNumber }) => {
  const { user } = useAuth();
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [showTagUsersModal, setShowTagUsersModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Theme-aware green colors
  const greenPrimary = isDark ? '#4ADE80' : '#4CAF50';
  const greenBackground = isDark ? 'rgba(74, 222, 128, 0.1)' : '#F9FFFE';
  const greenBorder = isDark ? 'rgba(74, 222, 128, 0.3)' : '#E8F5E9';

  const handleCancel = () => {
    if (caption || selectedImage || selectedActivities.length > 0 || taggedUsers.length > 0) {
      Alert.alert(
        'Discard Post?',
        'Are you sure you want to discard this post?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const resetForm = () => {
    setCaption('');
    setSelectedImage(null);
    setSelectedActivities([]);
    setTaggedUsers([]);
  };

  const handleImagePick = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handleChooseFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos. Please enable it in your device settings.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required to choose photos. Please enable it in your device settings.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error choosing from library:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const toggleActivity = (activityId) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleTagUsers = () => {
    setShowTagUsersModal(true);
  };

  const handleTagsUpdated = (users) => {
    setTaggedUsers(users);
  };

  const handleRemoveTag = (userId) => {
    setTaggedUsers(taggedUsers.filter((u) => u.id !== userId));
  };

  const handlePost = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }

    try {
      setIsPosting(true);

      // Upload image if selected (resize and compress first)
      let imageUrl = null;
      if (selectedImage) {
        const preparedImage = await preparePostImage(selectedImage);
        const uploadResult = await uploadImage(preparedImage.uri, 'rest-days');
        imageUrl = uploadResult.url;
      }

      // Get selected activity labels
      const activityLabels = selectedActivities
        .map((id) => REST_ACTIVITIES.find((a) => a.id === id)?.label)
        .filter(Boolean);

      // Calculate current streak
      const streak = await calculateStreakFromLocal(user.id);

      // Format the description to include activities if selected
      let finalDescription = caption || '';
      const activitiesText = activityLabels.length > 0
        ? `Recovery: ${activityLabels.join(', ')}`
        : 'Recovery: Rest Day';
      finalDescription = finalDescription
        ? `${finalDescription}\n\n${activitiesText}`
        : activitiesText;

      const postData = {
        authorId: user.id,
        description: finalDescription || null,
        imageUrl: imageUrl,
        published: true,
        streak: streak > 1 ? streak : null,
        taggedUserIds: taggedUsers.map(u => u.id),
      };

      const createdPost = await createPost(postData);

      // Send tag notifications to tagged users
      if (createdPost?.id && taggedUsers.length > 0) {
        await Promise.all(
          taggedUsers.map(taggedUser =>
            createTagNotification(taggedUser.id, user.id, createdPost.id)
          )
        );
      }

      // Save rest day completion locally
      await storage.saveRestDayCompletion({
        date: new Date().toISOString(),
        activities: activityLabels,
        caption: caption,
      });

      // Mark today as a rest day in the calendar (doesn't increase streak)
      await markTodayCompleted(true);

      // Reset form
      resetForm();

      // Notify parent
      if (onPostCreated) {
        onPostCreated();
      }

      Alert.alert('Posted!', 'Your rest day has been shared with your friends.');
    } catch (error) {
      console.error('Error posting rest day:', error);
      Alert.alert('Error', 'Failed to post rest day. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };


  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.secondaryText }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Log Rest Day</Text>
          <TouchableOpacity
            onPress={handlePost}
            style={[styles.headerButton, styles.postHeaderButton]}
            disabled={isPosting}
          >
            <Text style={[styles.postHeaderText, { color: colors.primary }, isPosting && { color: colors.placeholder }]}>
              {isPosting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Rest Day Info Card */}
            <View style={[styles.infoCard, { backgroundColor: greenBackground, borderColor: greenBorder }]}>
              <View style={styles.infoCardHeader}>
                <Text style={[styles.infoCardTitle, { color: greenPrimary }]}>Rest Day</Text>
                <View style={[styles.restBadge, { backgroundColor: greenPrimary }]}>
                  <Ionicons name="leaf" size={16} color={isDark ? '#111827' : '#FFFFFF'} />
                </View>
              </View>

              {splitName && (
                <>
                  <Text style={[styles.splitName, { color: colors.text }]}>
                    {splitEmoji && `${splitEmoji} `}{splitName}
                  </Text>
                  <Text style={[styles.cycleInfo, { color: colors.secondaryText }]}>
                    Cycle {weekNumber} · Day {dayNumber}
                  </Text>
                </>
              )}
            </View>

            {/* Rest Activities */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>What did you do?</Text>
              <View style={styles.activitiesGrid}>
                {REST_ACTIVITIES.map((activity) => {
                  const isSelected = selectedActivities.includes(activity.id);
                  return (
                    <TouchableOpacity
                      key={activity.id}
                      style={[
                        styles.activityChip,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        isSelected && { backgroundColor: greenPrimary, borderColor: greenPrimary },
                      ]}
                      onPress={() => toggleActivity(activity.id)}
                    >
                      <Ionicons
                        name={activity.icon}
                        size={18}
                        color={isSelected ? (isDark ? '#111827' : '#FFFFFF') : colors.secondaryText}
                      />
                      <Text
                        style={[
                          styles.activityChipText,
                          { color: colors.text },
                          isSelected && { color: isDark ? '#111827' : '#FFFFFF' },
                        ]}
                      >
                        {activity.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Image Upload Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Photo</Text>
              {selectedImage ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                  onPress={handleImagePick}
                >
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={[styles.uploadText, { color: colors.text }]}>Add Photo</Text>
                  <Text style={[styles.uploadSubtext, { color: colors.secondaryText }]}>Show off your recovery!</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Tag Users Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Tag Workout Partners</Text>
              <TouchableOpacity
                style={[styles.tagButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={handleTagUsers}
              >
                <Text style={[styles.tagButtonText, { color: colors.primary }]}>+ Tag Users</Text>
              </TouchableOpacity>

              {taggedUsers.length > 0 && (
                <View style={styles.taggedUsersContainer}>
                  {taggedUsers.map((taggedUser) => (
                    <View key={taggedUser.id} style={[styles.taggedUser, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.taggedUserText, { color: colors.primary }]}>@{taggedUser.username}</Text>
                      <TouchableOpacity onPress={() => handleRemoveTag(taggedUser.id)}>
                        <Text style={[styles.removeTagText, { color: colors.primary }]}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Description Input - Fixed at bottom */}
        <View style={[styles.descriptionInputContainer, { backgroundColor: colors.cardBackground, borderTopColor: colors.borderLight }]}>
          <TextInput
            style={[styles.descriptionInput, { backgroundColor: colors.borderLight + '30', color: colors.text }]}
            placeholder="How did you recover today?"
            placeholderTextColor={colors.placeholder}
            multiline
            blurOnSubmit
            returnKeyType="done"
            value={caption}
            onChangeText={setCaption}
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: colors.secondaryText }]}>{caption.length}/500</Text>
        </View>

        {/* Tag Users Modal */}
        <TagUsersModal
          visible={showTagUsersModal}
          onClose={() => setShowTagUsersModal(false)}
          selectedUsers={taggedUsers}
          onUsersSelected={handleTagsUpdated}
          currentUserId={user?.id}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default RestDayPostModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cancelText: {
    fontSize: 16,
  },
  postHeaderButton: {
    alignItems: 'flex-end',
  },
  postHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },

  // Info Card
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  restBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  cycleInfo: {
    fontSize: 14,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Activities
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Image Upload
  uploadButton: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Tag Users
  tagButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  tagButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  taggedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  taggedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 6,
  },
  taggedUserText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeTagText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Description Input Container - Fixed at bottom
  descriptionInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
  },
  descriptionInput: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 44,
  },
  charCount: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
});
