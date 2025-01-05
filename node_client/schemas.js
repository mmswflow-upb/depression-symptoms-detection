export const scoresSchema = {
  name: "symptom_scores_schema",
  schema: {
    type: "object",
    properties: {
      finalScores: {
        type: "object",
        description:
          "Scores for various symptoms, between 0 and 100!!!, it shows how much the user is experiencing the symptom.",
        properties: {
          anxiety: { type: "number", minimum: 0, maximum: 100 },
          sadness: { type: "number", minimum: 0, maximum: 100 },
          social_withdrawal: { type: "number", minimum: 0, maximum: 100 },
          irritability: { type: "number", minimum: 0, maximum: 100 },
          sleep_disturbance: { type: "number", minimum: 0, maximum: 100 },
          appetite_disturbance: { type: "number", minimum: 0, maximum: 100 },
          reckless_behavior: { type: "number", minimum: 0, maximum: 100 },
          reduced_productivity: { type: "number", minimum: 0, maximum: 100 },
          loss_of_interest: { type: "number", minimum: 0, maximum: 100 },
          physical_complaints: { type: "number", minimum: 0, maximum: 100 },
          memory_issues: { type: "number", minimum: 0, maximum: 100 },
          fear_of_separation: { type: "number", minimum: 0, maximum: 100 },
          sensitivity_to_rejection: {
            type: "number",
            minimum: 0,
            maximum: 100,
          },
          physical_heaviness: { type: "number", minimum: 0, maximum: 100 },
          concentration_difficulty: {
            type: "number",
            minimum: 0,
            maximum: 100,
          },
          fatigue: { type: "number", minimum: 0, maximum: 100 },
          worthlessness: { type: "number", minimum: 0, maximum: 100 },
          suicidal_ideation: { type: "number", minimum: 0, maximum: 100 },
        },
        required: [
          "anxiety",
          "sadness",
          "social_withdrawal",
          "irritability",
          "sleep_disturbance",
          "appetite_disturbance",
          "reckless_behavior",
          "reduced_productivity",
          "loss_of_interest",
          "physical_complaints",
          "memory_issues",
          "fear_of_separation",
          "sensitivity_to_rejection",
          "physical_heaviness",
          "concentration_difficulty",
          "fatigue",
          "worthlessness",
          "suicidal_ideation",
        ],
      },
      generalMoodScore: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Overall mood score (0 = happy, 1 = depressed)",
      },
    },
    required: ["finalScores", "generalMoodScore"],
  },
};

export const default_final_scores = {
  anxiety: 0,
  sadness: 0,
  social_withdrawal: 0,
  irritability: 0,
  sleep_disturbance: 0,
  appetite_disturbance: 0,
  reckless_behavior: 0,
  reduced_productivity: 0,
  loss_of_interest: 0,
  physical_complaints: 0,
  memory_issues: 0,
  fear_of_separation: 0,
  sensitivity_to_rejection: 0,
  physical_heaviness: 0,
  concentration_difficulty: 0,
  fatigue: 0,
  worthlessness: 0,
  suicidal_ideation: 0,
};

export const summarySchema = {
  name: "conversation_summary_schema",
  schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "Summary of past conversations.",
      },
    },
    required: ["summary"],
  },
};
