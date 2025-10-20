/**
 * Component options utility for AI Course Creator
 * Provides dynamic component options based on MFE configuration
 */

import { getConfig } from '@edx/frontend-platform';

/**
 * Get available component options based on MFE configuration
 * @returns {Array} Array of component option strings
 */
export const getAvailableComponentOptions = () => {
  const config = getConfig();
  const options = ['Text', 'Images'];

  // Add Video Content option if SHOW_VIDEO config is true
  if (config.SHOW_VIDEO_COMPONENT === true) {
    options.push('Video Content');
  }

  // Add Interactive Content option if SHOW_INTERACTIVE_HTML config is true
  if (config.SHOW_INTERACTIVE_COMPONENT === true) {
    options.push('Interactive Content');
  }

  return options;
};
