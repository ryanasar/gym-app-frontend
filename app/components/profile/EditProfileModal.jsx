import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { updateProfile } from '../../api/profileApi';
import { uploadImage } from '../../api/storageApi';
import { prepareProfileImage } from '../../utils/imageUpload';

const EditProfileModal = ({ visible, onClose, userId, currentBio, currentAvatarUrl, userName, onProfileUpdated }) => {
  const [bio, setBio] = useState(currentBio || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setBio(currentBio || '');
      setSelectedImage(null);
    }
  }, [visible, currentBio]);

  const handleImagePick = () => {
    Alert.alert(
      'Change Profile Photo',
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
        aspect: [1, 1],
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
        aspect: [1, 1],
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

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setSelectedImage('remove'),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      let avatarUrl = currentAvatarUrl;

      // Upload new image if selected
      if (selectedImage && selectedImage !== 'remove') {
        setIsUploadingImage(true);
        try {
          const preparedImage = await prepareProfileImage(selectedImage);
          const uploadResult = await uploadImage(preparedImage.uri, 'avatars');
          avatarUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          Alert.alert('Error', 'Failed to upload profile photo. Please try again.');
          setIsSaving(false);
          setIsUploadingImage(false);
          return;
        }
        setIsUploadingImage(false);
      } else if (selectedImage === 'remove') {
        avatarUrl = null;
      }

      const profileData = {
        bio: bio.trim(),
        avatarUrl,
      };

      const updatedProfile = await updateProfile(userId, profileData);

      // Notify parent component
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }

      Alert.alert('Success', 'Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  const hasChanges = bio !== (currentBio || '') || selectedImage !== null;

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setBio(currentBio || '');
              setSelectedImage(null);
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  // Determine what to show as avatar
  const getAvatarSource = () => {
    if (selectedImage === 'remove') {
      return null;
    }
    if (selectedImage) {
      return selectedImage;
    }
    if (currentAvatarUrl) {
      return currentAvatarUrl;
    }
    return null;
  };

  const avatarSource = getAvatarSource();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerButton, styles.saveButton]}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Photo Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleImagePick}
              activeOpacity={0.8}
            >
              {avatarSource ? (
                <Image
                  source={{ uri: avatarSource }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {userName ? userName.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
              {isUploadingImage && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
            {(avatarSource || currentAvatarUrl) && selectedImage !== 'remove' && (
              <TouchableOpacity onPress={handleRemoveImage} style={styles.removePhotoButton}>
                <Text style={styles.removePhotoText}>Remove photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={styles.bioInput}
              placeholder="Tell people about yourself..."
              placeholderTextColor={Colors.light.placeholder}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={150}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/150</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditProfileModal;

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
  headerButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  saveButtonTextDisabled: {
    color: Colors.light.secondaryText,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.light.onPrimary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.light.background,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  removePhotoButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  bioInput: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 120,
  },
  charCount: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    textAlign: 'right',
    marginTop: 6,
  },
});
