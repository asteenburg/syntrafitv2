export type Database = {
  public: {
    Tables: {
      programs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
        };
      };
      program_days: {
        Row: {
          id: string;
          program_id: string;
          day_index: number;
          name: string | null;
        };
      };
      program_day_exercises: {
        Row: {
          id: string;
          program_day_id: string;
          exercise_id: string;
          order_index: number;
          target_sets: number | null;
          target_reps_min: number | null;
          target_reps_max: number | null;
          rest_seconds: number | null;
          notes: string | null;
          exercises: {
            id: string;
            name: string;
          } | null;
        };
      };
      exercises: {
        Row: {
          id: string;
          name: string;
        };
      };
      program_day_completions: {
        Row: {
          user_id: string;
          program_day_id: string;
          program_id: string | null;
        };
      };
      user_setup_preferences: {
        Row: {
          user_id: string;
          session_minutes: number | null;
          primary_goal: string;
          equipment_type: string;
          days_per_week: number;
        };
      };
    };
    Relationships: [
      {
        foreignKeyName: "program_day_exercises_exercise_id_fkey";
        columns: ["exercise_id"];
        referencedRelation: "exercises";
        referencedColumns: ["id"];
      },
    ];
  };
};
