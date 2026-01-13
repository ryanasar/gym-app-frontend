import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../auth/auth';
import { useSync } from '../contexts/SyncContext';
import { createPost, updatePost } from '../api/postsApi';
import { uploadImage, deleteImage } from '../api/storageApi';
import { storage } from '../../storage';

const CreatePostScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, refreshPosts } = useAuth();
  const { manualSync } = useSync();

  // Determine if we're editing or creating
  const postId = params.postId;
  const isEditMode = !!postId;

  const workoutData = params.workoutData ? JSON.parse(params.workoutData) : null;
  const workoutSessionId = params.workoutSessionId;
  const splitId = params.splitId;
  const streak = params.streak ? parseInt(params.streak) : null;
  const initialDescription = params.description || '';

  const [description, setDescription] = useState(initialDescription);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [uploadedImagePath, setUploadedImagePath] = useState(null);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

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
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos. Please enable it in your device settings.'
        );
        return;
      }

      // Launch camera
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
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required to choose photos. Please enable it in your device settings.'
        );
        return;
      }

      // Launch image library
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

  const handleTagUsers = () => {
    // TODO: Implement user tagging
    Alert.alert('Tag Users', 'User tagging will be implemented here');
  };

  const handleRemoveTag = (userId) => {
    setTaggedUsers(taggedUsers.filter((id) => id !== userId));
  };

  const handlePost = async () => {
    if (isPosting) return;

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post.');
      return;
    }

    setIsPosting(true);

    try {
      let imageUrl = uploadedImageUrl;
      let imagePath = uploadedImagePath;

      // Upload image if one is selected and not already uploaded
      if (selectedImage && !uploadedImageUrl) {
        try {
          const uploadResult = await uploadImage(selectedImage, 'posts');
          imageUrl = uploadResult.url;
          imagePath = uploadResult.path;
          setUploadedImageUrl(imageUrl);
          setUploadedImagePath(imagePath);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert('Warning', 'Failed to upload image, but post will be created without it.');
          imageUrl = null;
          imagePath = null;
        }
      }

      if (isEditMode) {
        // Update existing post
        const postData = {
          description: description.trim() || null,
          imageUrl: imageUrl || null,
        };

        await updatePost(postId, postData);

        // Refresh posts to show the updated post
        await refreshPosts();

        // Trigger automatic sync
        manualSync();

        Alert.alert('Success', 'Post updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)/profile');
            },
          },
        ]);
      } else {
        // Create new post
        // Look up database ID for local workout ID
        let databaseWorkoutSessionId = null;
        if (workoutSessionId) {
          // Try to parse as integer first (in case it's already a database ID)
          const parsedId = parseInt(workoutSessionId);
          if (!isNaN(parsedId) && workoutSessionId === parsedId.toString()) {
            // It's already an integer ID
            databaseWorkoutSessionId = parsedId;
          } else {
            // It's a local ID, look up the database ID
            databaseWorkoutSessionId = await storage.getWorkoutDatabaseId(workoutSessionId);

            if (!databaseWorkoutSessionId) {
              console.warn('[CreatePost] Workout not synced yet, syncing now...');
              // Trigger a sync and wait for it
              await manualSync();
              // Try to get the database ID again - wait a bit for sync to complete
              await new Promise(resolve => setTimeout(resolve, 2000));
              databaseWorkoutSessionId = await storage.getWorkoutDatabaseId(workoutSessionId);

              if (!databaseWorkoutSessionId) {
                Alert.alert(
                  'Sync Required',
                  'Your workout needs to be synced to the server before posting. Please try again in a moment.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
                setIsPosting(false);
                return;
              }
            }
          }
        }

        const postData = {
          authorId: user.id,
          title: workoutData?.dayName || 'Workout Post',
          description: description.trim() || null,
          imageUrl: imageUrl || null,
          published: true,
          workoutSessionId: databaseWorkoutSessionId,
          splitId: splitId ? parseInt(splitId) : null,
          streak: streak,
        };

        await createPost(postData);

        // Refresh posts to show the new post
        await refreshPosts();

        // Trigger automatic sync
        manualSync();

        Alert.alert('Success', 'Post created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)/profile');
            },
          },
        ]);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} post:`, error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} post. Please try again.`);

      // Clean up uploaded image if post creation failed
      if (uploadedImagePath && !isEditMode) {
        try {
          await deleteImage(uploadedImagePath);
        } catch (deleteError) {
          console.error('Error deleting uploaded image:', deleteError);
        }
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleCancel = () => {
    if (description || selectedImage || taggedUsers.length > 0) {
      Alert.alert(
        'Discard Post?',
        'Are you sure you want to discard this post?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Post' : 'Create Post'}</Text>
        <TouchableOpacity
          onPress={handlePost}
          style={[styles.headerButton, styles.postButton]}
          disabled={isPosting}
        >
          <Text style={[styles.postText, isPosting && styles.postTextDisabled]}>
            {isPosting ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save' : 'Post')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Workout Summary Card */}
          {workoutData && (
            <View style={styles.workoutCard}>
              <View style={styles.workoutCardHeader}>
                <Text style={styles.workoutCardTitle}>Workout Completed</Text>
                <View style={styles.completeBadge}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.workoutName}>{workoutData.dayName}</Text>
              <Text style={styles.workoutDetails}>
                Week {workoutData.weekNumber} • Day {workoutData.dayNumber}
              </Text>

              <View style={styles.exercisesSummary}>
                <Text style={styles.exercisesSummaryTitle}>
                  {workoutData.exercises?.length || 0} Exercises
                </Text>
                {workoutData.exercises?.slice(0, 3).map((exercise, index) => (
                  <Text key={index} style={styles.exercisePreview}>
                    • {exercise.name}
                  </Text>
                ))}
                {workoutData.exercises?.length > 3 && (
                  <Text style={styles.exerciseMore}>
                    +{workoutData.exercises.length - 3} more
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Description <Text style={styles.optionalText}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="How did your workout go? Share your thoughts..."
              placeholderTextColor={Colors.light.placeholder}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          {/* Image Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Photo</Text>
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Add Photo</Text>
                <Text style={styles.uploadSubtext}>Show off your progress!</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tag Users Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tag Workout Partners</Text>
            <TouchableOpacity style={styles.tagButton} onPress={handleTagUsers}>
              <Text style={styles.tagButtonText}>+ Tag Users</Text>
            </TouchableOpacity>

            {taggedUsers.length > 0 && (
              <View style={styles.taggedUsersContainer}>
                {taggedUsers.map((user) => (
                  <View key={user} style={styles.taggedUser}>
                    <Text style={styles.taggedUserText}>@{user}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(user)}>
                      <Text style={styles.removeTagText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Additional Options */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Visibility</Text>
            <View style={styles.visibilityOptions}>
              <TouchableOpacity style={[styles.visibilityOption, styles.visibilityOptionActive]}>
                <Text style={styles.visibilityOptionText}>🌍 Public</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.visibilityOption}>
                <Text style={styles.visibilityOptionTextInactive}>👥 Friends Only</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreatePostScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  postButton: {
    alignItems: 'flex-end',
  },
  postText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  postTextDisabled: {
    color: Colors.light.placeholder,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },

  // Workout Card
  workoutCard: {
    backgroundColor: '#4CAF50' + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completeBadge: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  workoutName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 16,
  },
  exercisesSummary: {
    backgroundColor: Colors.light.cardBackground + '80',
    borderRadius: 12,
    padding: 12,
  },
  exercisesSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  exercisePreview: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginBottom: 4,
  },
  exerciseMore: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
    marginTop: 4,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  optionalText: {
    color: Colors.light.placeholder,
    fontWeight: '400',
    fontSize: 14,
  },

  // Description Input
  descriptionInput: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },

  // Image Upload
  uploadButton: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.light.border,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: Colors.light.secondaryText,
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
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tagButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
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
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 6,
  },
  taggedUserText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.primary,
  },
  removeTagText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },

  // Visibility Options
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  visibilityOptionActive: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
    backgroundColor: Colors.light.primary + '08',
  },
  visibilityOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  visibilityOptionTextInactive: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
});
