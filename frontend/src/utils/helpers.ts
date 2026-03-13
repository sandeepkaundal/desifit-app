import { format } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getTodayString = (): string => {
  return formatDate(new Date());
};

export const calculateExerciseCalories = (activity: string, duration: number): number => {
  const caloriesPerHour: { [key: string]: number } = {
    walking: 250,
    running: 600,
    cycling: 500,
    yoga: 250,
    skipping: 700,
    gym: 400,
  };
  
  const activityLower = activity.toLowerCase();
  const rate = caloriesPerHour[activityLower] || 300;
  return Math.round((rate / 60) * duration);
};
