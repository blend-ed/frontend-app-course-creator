import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

/**
 * List AI courses with optional filtering and pagination
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {string} params.status - Filter by status: 'pending', 'processing', 'success', 'failed'
 * @param {string} params.action - Filter by action type
 * @param {string} params.course_size - Filter by course size
 * @param {string} params.target_language - Filter by language
 * @param {string} params.org - Filter by organization
 * @param {string} params.search - Search in topic, instructions, and audience
 * @param {number} params.page - Page number for pagination
 * @param {number} params.page_size - Items per page
 * @param {boolean} params.detailed - Return detailed information
 * @param {string} params.ordering - Order by field (prefix with '-' for descending)
 * @returns {Promise<Object>} List of AI courses with pagination info
 */
export const listAICourses = async (params = {}) => {
  try {
    const config = getConfig();
    const baseUrl = config.STUDIO_BASE_URL;
    const queryParams = new URLSearchParams(params).toString();
    const url = `${baseUrl}/blendxcoursecreator_enterprise/api/ai-courses/${queryParams ? `?${queryParams}` : ''}`;

    const response = await getAuthenticatedHttpClient().get(url);
    return response;
  } catch (error) {
    console.error('List AI courses error:', error);
    throw error;
  }
};

/**
 * Get details of a specific AI course
 * @param {number} courseId - The AI course ID
 * @returns {Promise<Object>} AI course details
 */
export const getAICourse = async (courseId) => {
  try {
    const config = getConfig();
    const baseUrl = config.STUDIO_BASE_URL;
    const url = `${baseUrl}/blendxcoursecreator_enterprise/api/ai-courses/${courseId}/`;

    const response = await getAuthenticatedHttpClient().get(url);
    return response;
  } catch (error) {
    console.error('Get AI course error:', error);
    throw error;
  }
};

