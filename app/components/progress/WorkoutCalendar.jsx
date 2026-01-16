import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const WorkoutCalendar = ({ workoutsByDay = [], todaysWorkout = null }) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Generate calendar data for the last 28 days (4 weeks)
  const generateCalendarData = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Helper to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatLocalDate(today);

    for (let i = 27; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = formatLocalDate(date);

      // Find workout data for this day (check if any workout exists)
      const workoutDay = workoutsByDay.find(w => w.date === dateStr);
      const hasWorkout = !!workoutDay;
      let isRestDay = workoutDay?.isRestDay || false;

      // If this is today and we have todaysWorkout info, check if it's a rest day
      const isToday = dateStr === todayStr;
      if (isToday && todaysWorkout) {
        isRestDay = todaysWorkout.isRest ||
                    (todaysWorkout.exercises?.length === 0 && todaysWorkout.dayName === 'Rest Day');
      }

      days.push({
        date: dateStr,
        hasWorkout,
        isRestDay,
        day: date.getDate(),
        month: date.getMonth(),
        dayOfWeek: date.getDay(),
        isToday,
      });
    }

    return days;
  };

  const calendarData = generateCalendarData();

  // Get month label for the calendar period
  const getMonthLabels = () => {
    const firstDay = calendarData[0];
    const lastDay = calendarData[calendarData.length - 1];

    if (firstDay.month === lastDay.month) {
      return monthNames[firstDay.month];
    }
    return `${monthNames[firstDay.month]} - ${monthNames[lastDay.month]}`;
  };

  // Calculate stats
  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter out rest days for workout count
    const actualWorkouts = workoutsByDay.filter(w => !w.isRestDay);
    const totalWorkouts = actualWorkouts.length;

    // All activity dates (including rest days) for checking gaps
    const allActivityDates = workoutsByDay
      .map(w => {
        const [year, month, day] = w.date.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      })
      .sort((a, b) => b - a);

    // Build sets for efficient lookup
    const activityDateSet = new Set(workoutsByDay.map(w => w.date));
    const workoutDateSet = new Set(actualWorkouts.map(w => w.date));

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // Calculate longest streak (consecutive days with activity, counting only workouts)
    // Rest days preserve the streak but don't increment the count
    let longestStreak = 0;

    if (allActivityDates.length > 0) {
      // Sort ascending for finding consecutive spans
      const sortedActivitiesAsc = [...allActivityDates].sort((a, b) => a - b);

      let currentSpanWorkouts = 0;
      let prevDate = null;

      for (const activityDate of sortedActivitiesAsc) {
        const dateStr = formatDate(activityDate);

        if (prevDate === null) {
          // First activity
          currentSpanWorkouts = workoutDateSet.has(dateStr) ? 1 : 0;
        } else {
          const dayDiff = Math.floor((activityDate - prevDate) / (1000 * 60 * 60 * 24));

          if (dayDiff === 1) {
            // Consecutive day - continue the span
            if (workoutDateSet.has(dateStr)) {
              currentSpanWorkouts++;
            }
          } else if (dayDiff === 0) {
            // Same day (shouldn't happen but handle it)
            continue;
          } else {
            // Gap in activity - save best and start new span
            longestStreak = Math.max(longestStreak, currentSpanWorkouts);
            currentSpanWorkouts = workoutDateSet.has(dateStr) ? 1 : 0;
          }
        }
        prevDate = activityDate;
      }
      // Don't forget to check the last span
      longestStreak = Math.max(longestStreak, currentSpanWorkouts);
    }

    // Calculate current streak
    let currentStreak = 0;

    if (allActivityDates.length === 0) {
      return { totalWorkouts, longestStreak: 0, currentStreak: 0 };
    }

    // Check if most recent activity (workout OR rest day) is within 1 day
    const mostRecentActivity = allActivityDates[0];
    const daysSinceLastActivity = Math.floor((today - mostRecentActivity) / (1000 * 60 * 60 * 24));

    // Streak is broken if there's a 2+ day gap since any activity
    if (daysSinceLastActivity >= 2) {
      return { totalWorkouts, longestStreak, currentStreak: 0 };
    }

    // Count workouts in consecutive days (rest days preserve streak but don't count)
    // Start from most recent activity and work backwards
    let checkDate = new Date(mostRecentActivity);

    while (true) {
      const checkDateStr = formatDate(checkDate);

      if (activityDateSet.has(checkDateStr)) {
        // There's activity on this day
        if (workoutDateSet.has(checkDateStr)) {
          // It's a workout day - count it
          currentStreak++;
        }
        // Move to previous day (rest days don't break streak)
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // No activity on this day - streak broken
        break;
      }
    }

    return {
      totalWorkouts,
      longestStreak,
      currentStreak,
    };
  };

  const stats = calculateStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Calendar</Text>
        <Text style={styles.subtitle}>{getMonthLabels()} • Last 28 days</Text>
      </View>

      <View style={styles.calendarContainer}>
        {/* Weekday Headers */}
        <View style={styles.weekdayRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <View key={index} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid - 28 days in rows of 7 (4 full weeks) */}
        <View style={styles.calendarGrid}>
          {[0, 7, 14, 21].map((rowStart) => (
            <View key={rowStart} style={styles.calendarRow}>
              {calendarData.slice(rowStart, rowStart + 7).map((day, index) => (
                <View
                  key={day.date || `empty-${rowStart}-${index}`}
                  style={[
                    styles.day,
                    // Regular workout days
                    day.hasWorkout && !day.isRestDay && styles.dayCompleted,
                    // Rest days (only if actually logged/completed)
                    day.hasWorkout && day.isRestDay && styles.dayRestCompleted,
                    // Today's border (applied last to override colors if needed)
                    day.isToday && styles.dayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      day.hasWorkout && styles.dayNumberCompleted,
                      day.isToday && styles.dayNumberToday,
                    ]}
                  >
                    {day.day}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest{'\n'}Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Current{'\n'}Streak</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default WorkoutCalendar;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6E6E6E',
    fontWeight: '500',
  },
  calendarContainer: {
    width: '100%',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 4,
  },
  weekdayCell: {
    width: 36,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A9A9A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    gap: 5,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.borderLight,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  dayCompleted: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayRestCompleted: {
    backgroundColor: Colors.light.primary + '60', // 60% opacity for lighter shade
    borderColor: Colors.light.primary + '80', // 80% opacity for border
  },
  dayToday: {
    borderWidth: 3,
    borderColor: Colors.light.text,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  dayNumberCompleted: {
    color: Colors.light.onPrimary,
    fontWeight: '700',
  },
  dayNumberToday: {
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6E6E6E',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: Colors.light.borderLight,
  },
});
