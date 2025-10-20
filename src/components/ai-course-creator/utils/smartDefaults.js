/**
 * Smart defaults utility for AI Course Creator
 * Analyzes course topic and suggests appropriate settings
 */

export const getSmartDefaults = (topic) => {
  const lowerTopic = topic.toLowerCase();

  // Smart audience detection
  let audience = 'Let AI decide';
  if (lowerTopic.includes('beginner') || lowerTopic.includes('intro') || lowerTopic.includes('basic') || lowerTopic.includes('fundamental')) {
    audience = 'Beginners';
  } else if (lowerTopic.includes('advanced') || lowerTopic.includes('expert') || lowerTopic.includes('master') || lowerTopic.includes('professional')) {
    audience = 'Advanced';
  } else if (lowerTopic.includes('professional') || lowerTopic.includes('enterprise') || lowerTopic.includes('corporate')) {
    audience = 'Professionals';
  }

  // Smart duration detection - using standardized UI values
  let duration = 'Let AI decide';
  if (lowerTopic.includes('quick') || lowerTopic.includes('crash') || lowerTopic.includes('overview') || lowerTopic.includes('intro')) {
    duration = 'Short (10-20 minutes)';
  } else if (lowerTopic.includes('comprehensive') || lowerTopic.includes('complete') || lowerTopic.includes('master') || lowerTopic.includes('deep')) {
    duration = 'Long (1+ hours)';
  }

  // Smart components detection - separated into content and assessment
  let components = ['Text']; // Content components only
  let assessmentTypes = []; // Assessment components

  return {
    audience,
    duration,
    components,
    assessmentTypes
  };
};

