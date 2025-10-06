/**
 * Maps between UI-friendly duration values and API course_size values
 */

const DURATION_TO_COURSE_SIZE = {
  'Short (1-2 hours)': 'small',
  'Medium (3-5 hours)': 'medium',
  'Long (6+ hours)': 'large',
  'Let AI decide': 'ai-generated',
  'ai-generated': 'ai-generated'  // Handle when stored value is used
};

const COURSE_SIZE_TO_DURATION = {
  'small': 'Short (1-2 hours)',
  'medium': 'Medium (3-5 hours)',
  'large': 'Long (6+ hours)',
  'ai-generated': 'Let AI decide'
};

export const durationToCourseSize = (duration) => {
  return DURATION_TO_COURSE_SIZE[duration] || 'skip'; // Default to skip if mapping not found
};

export const courseSizeToDuration = (courseSize) => {
  return COURSE_SIZE_TO_DURATION[courseSize] || 'Skip'; // Default to Skip if mapping not found
};

