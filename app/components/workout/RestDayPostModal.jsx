import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { createPost } from '../../api/postsApi';
import { uploadImage } from '../../api/storageApi';
import { useAuth } from '../../auth/auth';
import { storage, calculateStreakFromLocal } from '../../../storage';
import { preparePostImage } from '../../utils/imageUpload';

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
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const toggleActivity = (activityId) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
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

      // Create the post
      // Format the description to include activities if selected
      let finalDescription = caption || '';
      if (activityLabels.length > 0) {
        const activitiesText = `Recovery: ${activityLabels.join(', ')}`;
        finalDescription = finalDescription
          ? `${finalDescription}\n\n${activitiesText}`
          : activitiesText;
      }

      const postData = {
        authorId: user.id, // Backend expects 'authorId' not 'userId'
        description: finalDescription || null,
        imageUrl: imageUrl,
        published: true, // Make sure post is visible
        streak: streak || null, // Include current streak
        // Don't send type or restActivities to avoid backend errors
        // The backend will treat this as a regular post
      };

      await createPost(postData);

      // Save rest day completion locally
      await storage.saveRestDayCompletion({
        date: new Date().toISOString(),
        activities: activityLabels,
        caption: caption,
      });

      // Reset form
      setCaption('');
      setSelectedImage(null);
      setSelectedActivities([]);

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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Rest Day</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Rest Day Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoEmoji}>🌿</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Rest Day</Text>
                {splitName && (
                  <Text style={styles.infoSubtitle}>
                    {splitEmoji && `${splitEmoji} `}{splitName} · Cycle {weekNumber} Day {dayNumber}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Image Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo (Optional)</Text>
            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                  contentFit="cover"
                  transition={200}
                />
                <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
                  <Ionicons name="close-circle" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
                <Ionicons name="image-outline" size={32} color={Colors.light.secondaryText} />
                <Text style={styles.uploadButtonText}>Add a photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Caption */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caption (Optional)</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="How did you recover today?"
              placeholderTextColor={Colors.light.secondaryText}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />
          </View>

          {/* Rest Activities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What did you do?</Text>
            <View style={styles.activitiesGrid}>
              {REST_ACTIVITIES.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityChip,
                    selectedActivities.includes(activity.id) && styles.activityChipSelected,
                  ]}
                  onPress={() => toggleActivity(activity.id)}
                >
                  <Ionicons
                    name={activity.icon}
                    size={18}
                    color={
                      selectedActivities.includes(activity.id)
                        ? '#FFFFFF'
                        : Colors.light.secondaryText
                    }
                  />
                  <Text
                    style={[
                      styles.activityChipText,
                      selectedActivities.includes(activity.id) && styles.activityChipTextSelected,
                    ]}
                  >
                    {activity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.postButton, isPosting && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={isPosting}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Post Rest Day</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default RestDayPostModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#F9FFFE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.borderLight,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 14,
  },
  captionInput: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  activityChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  activityChipTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  postButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
});
