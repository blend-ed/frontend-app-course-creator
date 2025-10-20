/**
 * Maps between UI-friendly duration values and API course_size values
 */

const DURATION_TO_COURSE_SIZE = {
  'Short (10-20 minutes)': 'small',
  'Medium (30-50 minutes)': 'medium',
  'Long (1+ hours)': 'large',
  'Let AI decide': 'ai-generated',
  'ai-generated': 'ai-generated'  // Handle when stored value is used
};

const COURSE_SIZE_TO_DURATION = {
  'small': 'Short (10-20 minutes)',
  'medium': 'Medium (30-50 minutes)',
  'large': 'Long (1+ hours)',
  'ai-generated': 'Let AI decide'
};

export const durationToCourseSize = (duration) => {
  return DURATION_TO_COURSE_SIZE[duration] || 'skip'; // Default to skip if mapping not found
};

export const courseSizeToDuration = (courseSize) => {
  return COURSE_SIZE_TO_DURATION[courseSize] || 'Skip'; // Default to Skip if mapping not found
};

