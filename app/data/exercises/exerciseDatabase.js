// Exercise Database
// This could eventually be moved to a backend API or local database

export const exercises = [
  {
    id: 1,
    name: "Bench Press",
    category: "compound",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front_delts"],
    equipment: "barbell",
    difficulty: "intermediate",
    instructions: [
      "Lie flat on the bench with your eyes under the bar",
      "Grip the bar with hands slightly wider than shoulder-width",
      "Unrack the bar and lower it to your chest",
      "Press the bar back up to starting position"
    ],
    tips: [
      "Keep your shoulder blades retracted",
      "Control the weight on the descent",
      "Don't bounce the bar off your chest"
    ]
  },
  {
    id: 2,
    name: "Pull-ups",
    category: "compound",
    primaryMuscles: ["lats", "rhomboids"],
    secondaryMuscles: ["biceps", "rear_delts"],
    equipment: "pull_up_bar",
    difficulty: "intermediate",
    instructions: [
      "Hang from the bar with palms facing away",
      "Pull your body up until chin clears the bar",
      "Lower yourself back down with control"
    ],
    tips: [
      "Engage your core throughout the movement",
      "Don't swing or use momentum",
      "Focus on pulling with your back muscles"
    ]
  },
  {
    id: 3,
    name: "Squats",
    category: "compound",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings", "calves", "core"],
    equipment: "barbell",
    difficulty: "intermediate",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Lower your body by bending at hips and knees",
      "Keep your chest up and knees tracking over toes",
      "Return to standing position"
    ],
    tips: [
      "Keep your weight on your heels",
      "Don't let knees cave inward",
      "Maintain a neutral spine"
    ]
  },
  {
    id: 4,
    name: "Lateral Raises",
    category: "isolation",
    primaryMuscles: ["side_delts"],
    secondaryMuscles: [],
    equipment: "dumbbells",
    difficulty: "beginner",
    instructions: [
      "Stand with dumbbells at your sides",
      "Raise arms out to sides until parallel to floor",
      "Lower with control back to starting position"
    ],
    tips: [
      "Lead with your pinkies",
      "Don't use too much weight",
      "Control the descent"
    ]
  },
  {
    id: 5,
    name: "Barbell Curls",
    category: "isolation",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: "barbell",
    difficulty: "beginner",
    instructions: [
      "Stand with barbell held at arm's length",
      "Curl the weight up by flexing your biceps",
      "Lower the weight back down with control"
    ],
    tips: [
      "Keep your elbows stationary",
      "Don't swing the weight",
      "Focus on the muscle contraction"
    ]
  },
  {
    id: 6,
    name: "Deadlifts",
    category: "compound",
    primaryMuscles: ["hamstrings", "glutes", "lower_back"],
    secondaryMuscles: ["traps", "lats", "forearms", "core"],
    equipment: "barbell",
    difficulty: "advanced",
    instructions: [
      "Stand with feet hip-width apart, barbell over mid-foot",
      "Bend at hips and knees to grip the bar",
      "Keep chest up and shoulders back",
      "Drive through heels to stand up straight"
    ],
    tips: [
      "Keep the bar close to your body",
      "Engage your lats throughout the movement",
      "Don't round your back"
    ]
  },
  {
    id: 7,
    name: "Overhead Press",
    category: "compound",
    primaryMuscles: ["front_delts", "side_delts"],
    secondaryMuscles: ["triceps", "traps", "core"],
    equipment: "barbell",
    difficulty: "intermediate",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Hold barbell at shoulder height",
      "Press the bar straight up overhead",
      "Lower back to starting position"
    ],
    tips: [
      "Keep your core tight",
      "Don't arch your back excessively",
      "Press in a straight line"
    ]
  },
  {
    id: 8,
    name: "Dumbbell Rows",
    category: "compound",
    primaryMuscles: ["lats", "middle_back"],
    secondaryMuscles: ["biceps", "rear_delts"],
    equipment: "dumbbells",
    difficulty: "beginner",
    instructions: [
      "Place one knee and hand on bench",
      "Hold dumbbell in opposite hand",
      "Pull weight to your hip",
      "Lower with control"
    ],
    tips: [
      "Keep your back straight",
      "Pull with your back, not your arm",
      "Squeeze your shoulder blade at the top"
    ]
  },
  {
    id: 9,
    name: "Dips",
    category: "compound",
    primaryMuscles: ["triceps", "chest"],
    secondaryMuscles: ["front_delts"],
    equipment: "bodyweight",
    difficulty: "intermediate",
    instructions: [
      "Support yourself on parallel bars",
      "Lower your body by bending your elbows",
      "Push back up to starting position"
    ],
    tips: [
      "Keep your body upright",
      "Don't go too low",
      "Control the descent"
    ]
  },
  {
    id: 10,
    name: "Lunges",
    category: "compound",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings", "calves", "core"],
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: [
      "Step forward into a lunge position",
      "Lower your back knee toward the ground",
      "Push back to starting position",
      "Repeat on other leg"
    ],
    tips: [
      "Keep your front knee over your ankle",
      "Don't let your knee cave inward",
      "Maintain good posture"
    ]
  },
  {
    id: 11,
    name: "Romanian Deadlifts",
    category: "compound",
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["lower_back", "core"],
    equipment: "barbell",
    difficulty: "intermediate",
    instructions: [
      "Hold barbell with overhand grip",
      "Keep knees slightly bent",
      "Hinge at hips, lowering the weight",
      "Return to starting position"
    ],
    tips: [
      "Feel the stretch in your hamstrings",
      "Keep the bar close to your legs",
      "Don't round your back"
    ]
  },
  {
    id: 12,
    name: "Tricep Pushdowns",
    category: "isolation",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    equipment: "cable",
    difficulty: "beginner",
    instructions: [
      "Stand at cable machine with rope or bar",
      "Keep elbows at your sides",
      "Push the weight down until arms are straight",
      "Slowly return to starting position"
    ],
    tips: [
      "Don't move your elbows",
      "Focus on the tricep contraction",
      "Control the weight on the way up"
    ]
  },
  {
    id: 13,
    name: "Hammer Curls",
    category: "isolation",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: "dumbbells",
    difficulty: "beginner",
    instructions: [
      "Hold dumbbells with neutral grip",
      "Keep elbows at your sides",
      "Curl weights up toward shoulders",
      "Lower with control"
    ],
    tips: [
      "Don't swing the weights",
      "Keep wrists straight",
      "Focus on the muscle contraction"
    ]
  },
  {
    id: 14,
    name: "Face Pulls",
    category: "isolation",
    primaryMuscles: ["rear_delts"],
    secondaryMuscles: ["middle_back", "traps"],
    equipment: "cable",
    difficulty: "beginner",
    instructions: [
      "Set cable at face height",
      "Pull rope to your face",
      "Separate the rope at your face",
      "Return to starting position"
    ],
    tips: [
      "Keep your elbows high",
      "Pull to your upper chest/face level",
      "Focus on rear delt contraction"
    ]
  },
  {
    id: 15,
    name: "Leg Press",
    category: "compound",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: "machine",
    difficulty: "beginner",
    instructions: [
      "Sit in leg press machine",
      "Place feet on platform shoulder-width apart",
      "Lower the weight by bending your knees",
      "Push through your heels to extend legs"
    ],
    tips: [
      "Don't let knees cave inward",
      "Keep your core engaged",
      "Control the descent"
    ]
  },
  {
    id: 16,
    name: "Calf Raises",
    category: "isolation",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: [
      "Stand with feet hip-width apart",
      "Rise up on your toes",
      "Hold briefly at the top",
      "Lower back down with control"
    ],
    tips: [
      "Get a full range of motion",
      "Pause at the top",
      "Control the descent"
    ]
  },
  {
    id: 17,
    name: "Plank",
    category: "isolation",
    primaryMuscles: ["core", "abs"],
    secondaryMuscles: ["front_delts", "glutes"],
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: [
      "Start in push-up position",
      "Hold your body in a straight line",
      "Keep your core engaged",
      "Hold for desired time"
    ],
    tips: [
      "Don't let hips sag",
      "Breathe normally",
      "Keep your head neutral"
    ]
  },
  {
    id: 18,
    name: "Russian Twists",
    category: "isolation",
    primaryMuscles: ["obliques", "abs"],
    secondaryMuscles: ["core"],
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: [
      "Sit with knees bent, feet off ground",
      "Lean back slightly",
      "Rotate your torso left and right",
      "Keep your core engaged throughout"
    ],
    tips: [
      "Control the movement",
      "Don't use momentum",
      "Keep your chest up"
    ]
  },
  {
    id: 19,
    name: "Incline Dumbbell Press",
    category: "compound",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front_delts", "triceps"],
    equipment: "dumbbells",
    difficulty: "intermediate",
    instructions: [
      "Set bench to 30-45 degree incline",
      "Hold dumbbells at chest level",
      "Press weights up and together",
      "Lower with control"
    ],
    tips: [
      "Don't arch your back excessively",
      "Control the weight on descent",
      "Focus on chest contraction"
    ]
  },
  {
    id: 20,
    name: "Leg Curls",
    category: "isolation",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner",
    instructions: [
      "Lie face down on leg curl machine",
      "Position pad behind your ankles",
      "Curl your heels toward your glutes",
      "Lower with control"
    ],
    tips: [
      "Don't use momentum",
      "Feel the stretch at the bottom",
      "Squeeze at the top"
    ]
  },
  {
    id: 21,
    name: "Chest Flyes",
    category: "isolation",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front_delts"],
    equipment: "dumbbells",
    difficulty: "beginner"
  },
  {
    id: 22,
    name: "Cable Chest Flyes",
    category: "isolation",
    primaryMuscles: ["chest"],
    secondaryMuscles: [],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 23,
    name: "Lat Pulldowns",
    category: "compound",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "rear_delts"],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 24,
    name: "Seated Cable Rows",
    category: "compound",
    primaryMuscles: ["middle_back"],
    secondaryMuscles: ["lats", "biceps"],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 25,
    name: "Hip Thrusts",
    category: "compound",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    equipment: "barbell",
    difficulty: "intermediate"
  },
  {
    id: 26,
    name: "Bulgarian Split Squats",
    category: "compound",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    equipment: "dumbbells",
    difficulty: "advanced"
  },
  {
    id: 27,
    name: "Step-Ups",
    category: "compound",
    primaryMuscles: ["glutes", "quadriceps"],
    secondaryMuscles: ["hamstrings", "calves"],
    equipment: "dumbbells",
    difficulty: "beginner"
  },
  {
    id: 28,
    name: "Glute Kickbacks",
    category: "isolation",
    primaryMuscles: ["glutes"],
    secondaryMuscles: [],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 29,
    name: "Preacher Curls",
    category: "isolation",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 30,
    name: "Skull Crushers",
    category: "isolation",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    equipment: "barbell",
    difficulty: "intermediate"
  },
  {
    id: 31,
    name: "Arnold Press",
    category: "compound",
    primaryMuscles: ["front_delts", "side_delts"],
    secondaryMuscles: ["triceps"],
    equipment: "dumbbells",
    difficulty: "intermediate"
  },
  {
    id: 32,
    name: "Reverse Pec Deck",
    category: "isolation",
    primaryMuscles: ["rear_delts"],
    secondaryMuscles: ["middle_back"],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 33,
    name: "Shrugs",
    category: "isolation",
    primaryMuscles: ["traps"],
    secondaryMuscles: [],
    equipment: "dumbbells",
    difficulty: "beginner"
  },
  {
    id: 34,
    name: "Smith Machine Squats",
    category: "compound",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: ["glutes"],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 35,
    name: "Hack Squats",
    category: "compound",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: ["glutes"],
    equipment: "machine",
    difficulty: "intermediate"
  },
  {
    id: 36,
    name: "Ab Rollouts",
    category: "isolation",
    primaryMuscles: ["abs"],
    secondaryMuscles: ["core"],
    equipment: "bodyweight",
    difficulty: "advanced"
  },
  {
    id: 37,
    name: "Hanging Leg Raises",
    category: "isolation",
    primaryMuscles: ["abs"],
    secondaryMuscles: ["hip_flexors"],
    equipment: "pull_up_bar",
    difficulty: "advanced"
  },
  {
    id: 38,
    name: "Cable Crunches",
    category: "isolation",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 39,
    name: "Farmer’s Walk",
    category: "compound",
    primaryMuscles: ["forearms", "core"],
    secondaryMuscles: ["traps"],
    equipment: "dumbbells",
    difficulty: "intermediate"
  },
  {
    id: 40,
    name: "Push-Ups",
    category: "compound",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front_delts"],
    equipment: "bodyweight",
    difficulty: "beginner"
  },
  {
    id: 41,
    name: "Incline Barbell Press",
    category: "compound",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front_delts", "triceps"],
    equipment: "barbell",
    difficulty: "intermediate"
  },
  {
    id: 42,
    name: "Machine Chest Press",
    category: "compound",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front_delts"],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 43,
    name: "Cable Lateral Raises",
    category: "isolation",
    primaryMuscles: ["side_delts"],
    secondaryMuscles: [],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 44,
    name: "Rear Delt Flyes",
    category: "isolation",
    primaryMuscles: ["rear_delts"],
    secondaryMuscles: ["middle_back"],
    equipment: "dumbbells",
    difficulty: "beginner"
  },
  {
    id: 45,
    name: "Machine Shoulder Press",
    category: "compound",
    primaryMuscles: ["front_delts", "side_delts"],
    secondaryMuscles: ["triceps"],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 46,
    name: "Assisted Pull-Ups",
    category: "compound",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps"],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 47,
    name: "T-Bar Rows",
    category: "compound",
    primaryMuscles: ["middle_back"],
    secondaryMuscles: ["lats", "biceps"],
    equipment: "barbell",
    difficulty: "intermediate"
  },
  {
    id: 48,
    name: "Chest-Supported Dumbbell Rows",
    category: "compound",
    primaryMuscles: ["middle_back"],
    secondaryMuscles: ["rear_delts", "biceps"],
    equipment: "dumbbells",
    difficulty: "beginner"
  },
  {
    id: 49,
    name: "Cable Rows (Wide Grip)",
    category: "compound",
    primaryMuscles: ["middle_back"],
    secondaryMuscles: ["rear_delts", "biceps"],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 50,
    name: "Good Mornings",
    category: "compound",
    primaryMuscles: ["hamstrings", "lower_back"],
    secondaryMuscles: ["glutes", "core"],
    equipment: "barbell",
    difficulty: "advanced"
  },
  {
    id: 51,
    name: "Seated Leg Extensions",
    category: "isolation",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 52,
    name: "Standing Calf Raises (Machine)",
    category: "isolation",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 53,
    name: "Seated Calf Raises",
    category: "isolation",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 54,
    name: "Cable Pullovers",
    category: "isolation",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["core"],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 55,
    name: "EZ-Bar Curls",
    category: "isolation",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: "barbell",
    difficulty: "beginner"
  },
  {
    id: 56,
    name: "Incline Dumbbell Curls",
    category: "isolation",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
    equipment: "dumbbells",
    difficulty: "intermediate"
  },
  {
    id: 57,
    name: "Cable Tricep Extensions (Overhead)",
    category: "isolation",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 58,
    name: "Close-Grip Bench Press",
    category: "compound",
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["chest", "front_delts"],
    equipment: "barbell",
    difficulty: "intermediate"
  },
  {
    id: 59,
    name: "Machine Hip Abductions",
    category: "isolation",
    primaryMuscles: ["glutes"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 60,
    name: "Machine Hip Adductions",
    category: "isolation",
    primaryMuscles: ["inner_thighs"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 61,
    name: "Single-Arm Dumbbell Bench Press",
    category: "compound",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front_delts", "core"],
    equipment: "dumbbells",
    difficulty: "intermediate"
  },
  {
    id: 62,
    name: "Decline Barbell Bench Press",
    category: "compound",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front_delts"],
    equipment: "barbell",
    difficulty: "intermediate"
  },
  {
    id: 63,
    name: "Pec Deck Flyes",
    category: "isolation",
    primaryMuscles: ["chest"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner"
  },
  {
    id: 64,
    name: "Straight-Arm Pulldowns",
    category: "isolation",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["core"],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 65,
    name: "Wide-Grip Pull-Ups",
    category: "compound",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "rear_delts"],
    equipment: "pull_up_bar",
    difficulty: "advanced"
  },
  {
    id: 66,
    name: "Meadows Rows",
    category: "compound",
    primaryMuscles: ["middle_back"],
    secondaryMuscles: ["lats", "rear_delts", "biceps"],
    equipment: "barbell",
    difficulty: "advanced"
  },
  {
    id: 67,
    name: "Cable Upright Rows",
    category: "compound",
    primaryMuscles: ["traps", "side_delts"],
    secondaryMuscles: ["biceps"],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 68,
    name: "Front Raises",
    category: "isolation",
    primaryMuscles: ["front_delts"],
    secondaryMuscles: [],
    equipment: "dumbbells",
    difficulty: "beginner"
  },
  {
    id: 69,
    name: "Z-Press",
    category: "compound",
    primaryMuscles: ["front_delts", "side_delts"],
    secondaryMuscles: ["triceps", "core"],
    equipment: "barbell",
    difficulty: "advanced"
  },
  {
    id: 70,
    name: "Nordic Hamstring Curls",
    category: "isolation",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes"],
    equipment: "bodyweight",
    difficulty: "advanced"
  },
  {
    id: 71,
    name: "Single-Leg Romanian Deadlifts",
    category: "compound",
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["core"],
    equipment: "dumbbells",
    difficulty: "intermediate"
  },
  {
    id: 72,
    name: "Cable Glute Pull-Throughs",
    category: "compound",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 73,
    name: "Sissy Squats",
    category: "isolation",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: [],
    equipment: "bodyweight",
    difficulty: "advanced"
  },
  {
    id: 74,
    name: "Goblet Squats",
    category: "compound",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["core"],
    equipment: "dumbbells",
    difficulty: "beginner"
  },
  {
    id: 75,
    name: "Reverse Lunges",
    category: "compound",
    primaryMuscles: ["glutes", "quadriceps"],
    secondaryMuscles: ["hamstrings", "core"],
    equipment: "bodyweight",
    difficulty: "beginner"
  },
  {
    id: 76,
    name: "Cable Woodchoppers",
    category: "isolation",
    primaryMuscles: ["obliques"],
    secondaryMuscles: ["core"],
    equipment: "cable",
    difficulty: "beginner"
  },
  {
    id: 77,
    name: "Decline Sit-Ups",
    category: "isolation",
    primaryMuscles: ["abs"],
    secondaryMuscles: ["hip_flexors"],
    equipment: "bodyweight",
    difficulty: "intermediate"
  },
  {
    id: 78,
    name: "Weighted Plank",
    category: "isolation",
    primaryMuscles: ["core"],
    secondaryMuscles: ["abs", "glutes"],
    equipment: "bodyweight",
    difficulty: "intermediate"
  },
  {
    id: 79,
    name: "Barbell Wrist Curls",
    category: "isolation",
    primaryMuscles: ["forearms"],
    secondaryMuscles: [],
    equipment: "barbell",
    difficulty: "beginner"
  },
  {
    id: 80,
    name: "Reverse Wrist Curls",
    category: "isolation",
    primaryMuscles: ["forearms"],
    secondaryMuscles: [],
    equipment: "barbell",
    difficulty: "beginner"
  },
  {
    id: 81,
    name: "Battle Ropes",
    category: "compound",
    primaryMuscles: ["shoulders", "core"],
    secondaryMuscles: ["forearms"],
    equipment: "machine",
    difficulty: "intermediate"
  },
  {
    id: 82,
    name: "Sled Push",
    category: "compound",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["calves", "core"],
    equipment: "machine",
    difficulty: "intermediate"
  },
  {
    id: 83,
    name: "Sled Pull",
    category: "compound",
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["core"],
    equipment: "machine",
    difficulty: "intermediate"
  },
  {
    id: 84,
    name: "Landmine Press",
    category: "compound",
    primaryMuscles: ["front_delts"],
    secondaryMuscles: ["triceps", "core"],
    equipment: "barbell",
    difficulty: "intermediate"
  },
  {
    id: 85,
    name: "Landmine Rows",
    category: "compound",
    primaryMuscles: ["middle_back"],
    secondaryMuscles: ["lats", "biceps"],
    equipment: "barbell",
    difficulty: "intermediate"
  },
  {
    id: 86,
    name: "Trap Bar Deadlift",
    category: "compound",
    primaryMuscles: ["glutes", "hamstrings", "quadriceps"],
    secondaryMuscles: ["lower_back", "traps", "core"],
    equipment: "trap_bar",
    difficulty: "intermediate",
    instructions: [
      "Stand inside the trap bar with feet hip-width apart",
      "Grip the handles and brace your core",
      "Drive through your heels to stand up",
      "Lower the weight with control"
    ],
    tips: [
      "Keep your chest tall",
      "Push the floor away",
      "Do not jerk the weight off the ground"
    ]
  },
  {
    id: 87,
    name: "Standing Dumbbell Overhead Press",
    category: "compound",
    primaryMuscles: ["front_delts", "side_delts"],
    secondaryMuscles: ["triceps", "core"],
    equipment: "dumbbells",
    difficulty: "intermediate",
    instructions: [
      "Hold dumbbells at shoulder height",
      "Brace your core and glutes",
      "Press dumbbells overhead",
      "Lower back to starting position with control"
    ],
    tips: [
      "Do not lean back",
      "Press in a straight line",
      "Control the eccentric"
    ]
  },
  {
    id: 88,
    name: "Single-Leg Calf Raises",
    category: "isolation",
    primaryMuscles: ["calves"],
    secondaryMuscles: ["ankles"],
    equipment: "bodyweight",
    difficulty: "beginner",
    instructions: [
      "Stand on one foot near a wall or rail",
      "Rise onto your toes",
      "Pause briefly at the top",
      "Lower slowly under control"
    ],
    tips: [
      "Use full range of motion",
      "Slow eccentric",
      "Do not bounce"
    ]
  },
  {
    id: 89,
    name: "Pallof Press",
    category: "isolation",
    primaryMuscles: ["core"],
    secondaryMuscles: ["obliques"],
    equipment: "cable",
    difficulty: "beginner",
    instructions: [
      "Stand perpendicular to the cable stack",
      "Hold handle at chest height",
      "Press arms straight out",
      "Resist rotation and return slowly"
    ],
    tips: [
      "Brace your abs hard",
      "Do not twist",
      "Control the movement"
    ]
  },
  {
    id: 90,
    name: "Walking Lunges",
    category: "compound",
    primaryMuscles: ["glutes", "quadriceps"],
    secondaryMuscles: ["hamstrings", "calves", "core"],
    equipment: "dumbbells",
    difficulty: "beginner",
    instructions: [
      "Step forward into a lunge",
      "Lower back knee toward the ground",
      "Step through into next rep",
      "Alternate legs continuously"
    ],
    tips: [
      "Stay tall",
      "Drive through the front heel",
      "Do not rush reps"
    ]
  }
];

// Helper functions for filtering exercises
export const getExercisesByMuscle = (muscle) => {
  return exercises.filter(exercise =>
    exercise.primaryMuscles.includes(muscle) ||
    exercise.secondaryMuscles.includes(muscle)
  );
};

export const getExercisesByEquipment = (equipment) => {
  return exercises.filter(exercise => exercise.equipment === equipment);
};

export const getExercisesByDifficulty = (difficulty) => {
  return exercises.filter(exercise => exercise.difficulty === difficulty);
};

export const getExercisesByCategory = (category) => {
  return exercises.filter(exercise => exercise.category === category);
};

export const searchExercises = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(lowercaseQuery) ||
    exercise.primaryMuscles.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
    exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(lowercaseQuery))
  );
};

export default exercises;