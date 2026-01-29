import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteSplit, getSplitsByUserId } from '../api/splitsApi';
import { useAuth } from '../auth/auth';
import ChangeSplitModal from '../components/program/ChangeSplitModal';
import SplitCard from '../components/program/SplitCard';
import SavedWorkoutsTab from '../components/program/SavedWorkoutsTab';
import ScreenHeader from '../components/ui/ScreenHeader';
import TabBar from '../components/ui/TabBar';
import { Colors } from '../constants/colors';
import { useSync } from '../contexts/SyncContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { clearLocalSplit } from '../utils/clearLocalSplit';
import { useThemeColors } from '../hooks/useThemeColors';

const ProgramScreen = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { manualSync } = useSync();
  const { activeSplit, currentWeek, currentDayIndex, changeActiveSplit, todaysWorkout } = useWorkout();
  const [allUserSplits, setAllUserSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showChangeSplitModal, setShowChangeSplitModal] = useState(false);
  const hasFetchedRef = useRef(false);

  // Tab toggle state: 'splits' or 'saved'
  const [activeTab, setActiveTab] = useState('splits');

  // Fetch splits only on mount
  useEffect(() => {
    if (user?.id && !hasFetchedRef.current) {
      fetchSplits();
      hasFetchedRef.current = true;
    }
  }, [user?.id]);

  // Refetch only when returning from split creation/editing with refreshSplits param
  useEffect(() => {
    if (params.refreshSplits === 'true' && hasFetchedRef.current) {
      fetchSplits();
      // Clear the param
      router.setParams({ refreshSplits: undefined });
    }
  }, [params.refreshSplits]);

  // Re-sync when activeSplit changes
  useEffect(() => {
    if (allUserSplits.length > 0) {
      setAllUserSplits(prevSplits =>
        prevSplits.map(split => ({
          ...split,
          isActive: activeSplit?.id === split.id
        }))
      );
    }
  }, [activeSplit?.id]);

  // Auto-activate first split if no active split exists but splits are available
  useEffect(() => {
    if (!loading && allUserSplits.length > 0 && !activeSplit) {
      const firstSplit = allUserSplits[0];
      changeActiveSplit(firstSplit);
    }
  }, [loading, allUserSplits, activeSplit]);

  const fetchSplits = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const splits = await getSplitsByUserId(user.id);

      // Format splits to match expected structure
      const formattedSplits = splits.map((split) => ({
        id: split.id,
        name: split.name,
        totalDays: split.numDays,
        emoji: split.emoji,
        isActive: false, // Will be set below
        description: split.description,
        started: split.started,
        isPublic: split.isPublic,
        workoutDays: split.workoutDays,
        days: split.workoutDays.map((day, index) => ({
          dayIndex: index,
          name: day.workoutName,
          type: day.workoutType,
          emoji: day.emoji,
          isRest: day.isRest,
          // Backend already parses exercises, don't parse again
          exercises: day.exercises || []
        }))
      }));

      // Mark the split that matches the context as active
      // If no match (e.g., context has mock data), mark the first split as active
      let hasActiveMatch = false;
      for (let split of formattedSplits) {
        if (activeSplit?.id === split.id) {
          split.isActive = true;
          hasActiveMatch = true;
          break;
        }
      }

      // If no active split matches (mock data scenario), mark first as active
      if (!hasActiveMatch && formattedSplits.length > 0) {
        formattedSplits[0].isActive = true;

        // Update the context to use this split
        if (formattedSplits[0].id !== activeSplit?.id) {
          changeActiveSplit(formattedSplits[0]);
        }
      }

      setAllUserSplits(formattedSplits);
    } catch (error) {
      console.error('Failed to fetch splits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out the active split from other splits
  const otherSplits = allUserSplits.filter(split => !split.isActive);
  const currentActiveSplit = allUserSplits.find(split => split.isActive);

  const handleEditSplit = () => {
    if (currentActiveSplit) {
      // Navigate to split creation flow with edit mode and split data
      router.push({
        pathname: '/split/create',
        params: {
          editMode: 'true',
          splitId: currentActiveSplit.id.toString(),
          splitData: JSON.stringify(currentActiveSplit)
        }
      });
    }
  };

  const handleChangeActiveSplit = () => {
    // Check if there are other splits besides the active one
    if (otherSplits.length === 0) {
      Alert.alert(
        'No Other Splits',
        'You need to create another split before you can switch. Create a new split from the "Other Splits" section below.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowChangeSplitModal(true);
  };

  const handleSelectNewSplit = async (selectedSplit) => {
    Alert.alert(
      'Switch to This Split?',
      `You're about to switch from "${currentActiveSplit?.name}" to "${selectedSplit.name}".\n\nThis will:\n• Start "${selectedSplit.name}" at Week 1, Day 1\n• Make "${selectedSplit.name}" your active split\n\nYour previous workouts are saved and won't be deleted.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setShowChangeSplitModal(false);
          }
        },
        {
          text: 'Switch Split',
          style: 'default',
          onPress: async () => {
            try {
              // Close modal first
              setShowChangeSplitModal(false);

              // Change the active split in context (this handles AsyncStorage)
              await changeActiveSplit(selectedSplit);

              // Update local UI state
              setAllUserSplits(prevSplits =>
                prevSplits.map(s => ({
                  ...s,
                  isActive: s.id === selectedSplit.id
                }))
              );

              // Show success message
              Alert.alert(
                'Split Changed!',
                `You're now on "${selectedSplit.name}" starting at Week 1, Day 1. Your previous workouts are still saved in your history.`,
                [{ text: 'Got it' }]
              );
            } catch (error) {
              console.error('Error changing split:', error);
              Alert.alert('Error', 'Failed to change split. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleViewWorkouts = () => {
    if (currentActiveSplit) {
      router.push({
        pathname: '/split/view',
        params: {
          splitData: JSON.stringify(currentActiveSplit)
        }
      });
    }
  };

  const handleCreateNewSplit = () => {
    router.push({
      pathname: '/split/create',
      params: { fromProgram: 'true' }
    });
  };

  const handleSplitPress = (split) => {
    // Navigate to view split screen
    router.push({
      pathname: '/split/view',
      params: {
        splitData: JSON.stringify(split)
      }
    });
  };

  const handleDeleteSplit = (split) => {
    // Check if this is the active split
    const isActiveSplit = split.id === activeSplit?.id;

    Alert.alert(
      'Delete Split',
      `Are you sure you want to delete "${split.name}"?${isActiveSplit ? '\n\nThis is your active split. You\'ll need to select a new one.' : ''}\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from backend
              await deleteSplit(split.id);

              // Remove from local state
              setAllUserSplits(prevSplits => prevSplits.filter(s => s.id !== split.id));

              // If it was the active split, clear it
              if (isActiveSplit) {
                await clearLocalSplitData();
                changeActiveSplit(null);
              }

              Alert.alert('Success', 'Split deleted successfully' + (isActiveSplit ? '. Create or select a new split to continue.' : ''));
            } catch (error) {
              console.error('Failed to delete split:', error);
              Alert.alert('Error', 'Failed to delete split. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger sync on pull-to-refresh
    manualSync();
    await fetchSplits();
    setRefreshing(false);
  };

  // Helper to clear local split data
  const clearLocalSplitData = async () => {
    try {
      await clearLocalSplit();
      console.log('[Program] Cleared local split data');
    } catch (error) {
      console.error('[Program] Error clearing local split:', error);
    }
  };

  const renderSplitCard = ({ item }) => (
    <SplitCard split={item} onPress={() => handleSplitPress(item)} />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ScreenHeader
        title="Program"
        style={[styles.headerContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}
      />

      {/* Tab Bar */}
      <TabBar
        tabs={[
          { key: 'splits', label: 'Splits' },
          { key: 'saved', label: 'Saved Workouts' },
        ]}
        activeTab={activeTab}
        onTabPress={setActiveTab}
        style={{ backgroundColor: colors.cardBackground, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
      />

      {activeTab === 'saved' ? (
        <SavedWorkoutsTab />
      ) : (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.contentContainer}>
          {/* Active Split Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Split</Text>

            {currentActiveSplit ? (
              <View style={[styles.activeProgramCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow, borderColor: colors.borderLight }]}>
                {/* Program Info with Circular Emoji Icon */}
                <View style={styles.activeProgramHeader}>
                  <View style={[styles.emojiCircle, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={styles.emojiCircleText}>{currentActiveSplit.emoji}</Text>
                  </View>
                  <View style={styles.activeProgramTextContainer}>
                    <Text style={[styles.activeProgramName, { color: colors.text }]}>{currentActiveSplit.name}</Text>
                    <Text style={[styles.activeProgramDescription, { color: colors.secondaryText }]}>
                      Today's Workout: {todaysWorkout?.dayName || 'Rest Day'}
                    </Text>
                    <Text style={[styles.activeProgramSubDescription, { color: colors.secondaryText }]}>
                      {currentActiveSplit.totalDays} days • Week {currentWeek} Day {currentDayIndex + 1}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={[styles.activeProgramDivider, { backgroundColor: colors.borderLight }]} />

                {/* Action Buttons */}
                <View style={styles.activeProgramActions}>
                  {/* Primary Action - Full Width */}
                  <TouchableOpacity
                    style={[styles.primaryActionButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={handleViewWorkouts}
                  >
                    <Text style={[styles.primaryActionButtonText, { color: colors.onPrimary }]}>View Workouts</Text>
                  </TouchableOpacity>

                  {/* Secondary Actions Row */}
                  <View style={styles.secondaryActionsRow}>
                    <TouchableOpacity
                      style={[styles.secondaryActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                      onPress={handleChangeActiveSplit}
                    >
                      <Text style={[styles.secondaryActionButtonText, { color: colors.text }]}>Switch Split</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.secondaryActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                      onPress={handleEditSplit}
                    >
                      <Text style={[styles.secondaryActionButtonText, { color: colors.text }]}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={[styles.noActiveSplit, { color: colors.secondaryText }]}>No active split selected</Text>
            )}
          </View>

          {/* Other Splits Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Other Splits</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>Your saved programs</Text>
            </View>

            {/* Create New Split Button above Other Splits */}
            <TouchableOpacity style={[styles.createSplitButton, { backgroundColor: colors.cardBackground, borderColor: colors.primary, shadowColor: colors.shadow }]} onPress={handleCreateNewSplit}>
              <Text style={[styles.createSplitButtonText, { color: colors.primary }]}>+ Create New Split</Text>
            </TouchableOpacity>

            <View style={styles.splitsContainer}>
              {loading ? (
                <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading splits...</Text>
              ) : otherSplits.length > 0 ? (
                otherSplits.map((split) => (
                  <SplitCard
                    key={split.id}
                    split={split}
                    onPress={() => handleSplitPress(split)}
                    onDelete={handleDeleteSplit}
                    showDelete={true}
                  />
                ))
              ) : (
                <Text style={[styles.noSplitsText, { color: colors.secondaryText }]}>No other splits yet.</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      )}

      {/* Change Split Modal */}
      <ChangeSplitModal
        visible={showChangeSplitModal}
        onClose={() => setShowChangeSplitModal(false)}
        currentSplit={currentActiveSplit}
        otherSplits={otherSplits}
        onSelectSplit={handleSelectNewSplit}
      />
    </View>
  );
};

export default ProgramScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6E6E6E',
  },
  activeProgramCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  activeProgramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.light.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emojiCircleText: {
    fontSize: 28,
  },
  activeProgramTextContainer: {
    flex: 1,
  },
  activeProgramName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  activeProgramDescription: {
    fontSize: 15,
    color: '#6E6E6E',
    fontWeight: '500',
    marginBottom: 6,
  },
  activeProgramSubDescription: {
    fontSize: 13,
    color: '#9A9A9A',
    fontWeight: '400',
  },
  activeProgramDivider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: 20,
  },
  activeProgramActions: {
    gap: 12,
  },
  primaryActionButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionButtonText: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  splitsContainer: {
    gap: 12,
  },
  createSplitButton: {
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  createSplitButtonText: {
    color: Colors.light.primary,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  noActiveSplit: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    paddingVertical: 20,
  },
  noSplitsText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },

});