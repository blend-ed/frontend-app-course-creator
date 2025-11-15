import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

/**
 * Fetches list of organizations from the API
 * @param {number} [page=1] - Page number
 * @param {number} [pageSize=200] - Number of results per page
 * @returns {Promise<Object>} The API response containing organizations
 * @throws {Error} When API call fails
 */
export const getOrganizations = async (page = 1, pageSize = 200) => {
  try {
    const config = getConfig();
    const baseUrl = config.LMS_BASE_URL;

    if (!baseUrl) {
      throw new Error('LMS_BASE_URL is not configured. Please check your environment configuration.');
    }

    const url = `${baseUrl}/api/organizations/v0/organizations/?page=${page}&page_size=${pageSize}`;
    console.log('Fetching organizations from:', url);

    const response = await getAuthenticatedHttpClient().get(url);
    return response;
  } catch (error) {
    console.error('Organizations API Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

/**
 * Fetches all organizations from the API by handling pagination
 * @returns {Promise<Array>} Array of all organizations
 * @throws {Error} When API call fails
 */
export const getAllOrganizations = async () => {
  try {
    const allOrganizations = [];
    let page = 1;
    let hasMore = true;
    const pageSize = 200;

    while (hasMore) {
      const response = await getOrganizations(page, pageSize);
      const results = response.data?.results || [];
      allOrganizations.push(...results);

      // Check if there are more pages
      const next = response.data?.next;
      hasMore = next !== null;
      page++;
    }

    return allOrganizations;
  } catch (error) {
    console.error('Error fetching all organizations:', error);
    throw error;
  }
};

/**
 * Creates or updates course content using the Course Creator API
 * @param {Object} requestData - The course creation request data
 * @param {string} requestData.action - Action to perform: 'create_structure', 'update_structure', or 'create_content'
 * @param {string} requestData.topic - Course topic or title
 * @param {string} [requestData.instructions] - Additional instructions for course generation
 * @param {Object} [requestData.course_structure] - Required for 'create_content' and 'update_structure' actions
 * @param {string} [requestData.course_size='medium'] - Course size: 'small', 'medium', 'large', or 'ai-generated'
 * @param {string[]} [requestData.attachment_path] - List of file paths to upload and process for context
 * @param {string[]} [requestData.available_components] - List of available component types to include
 * @param {string} [requestData.audience] - Target audience (e.g., "beginners", "professionals")
 * @param {string} [requestData.target_language='en'] - Language code: 'en', 'es', 'fr', 'de', 'hi', 'ml', 'ar', 'he', 'fa', 'ur'
 * @param {string} [requestData.org='AI'] - Organization identifier
 * @returns {Promise<Object>} The API response
 * @throws {Error} When request validation fails or API call fails
 */
export const createCourse = async (requestData) => {
  try {
    // Validate required fields
    if (!requestData.action) {
      throw new Error('Action is required. Must be one of: create_structure, update_structure, create_content');
    }

    if (!requestData.topic) {
      throw new Error('Topic is required');
    }

    // Validate action values
    const validActions = ['create_structure', 'update_structure', 'create_content'];
    if (!validActions.includes(requestData.action)) {
      throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    // Validate course_structure requirement for specific actions
    const actionsRequiringStructure = ['create_content', 'update_structure'];
    if (actionsRequiringStructure.includes(requestData.action) && !requestData.course_structure) {
      throw new Error(`course_structure is required for action: ${requestData.action}`);
    }

    // Validate course_size if provided
    if (requestData.course_size) {
      const validSizes = ['small', 'medium', 'large', 'ai-generated'];
      if (!validSizes.includes(requestData.course_size)) {
        throw new Error(`Invalid course_size. Must be one of: ${validSizes.join(', ')}`);
      }
    }

    // Validate target_language if provided
    if (requestData.target_language) {
      const validLanguages = ['en', 'es', 'fr', 'de', 'hi', 'ml', 'ar', 'he', 'fa', 'ur'];
      if (!validLanguages.includes(requestData.target_language)) {
        throw new Error(`Invalid target_language. Must be one of: ${validLanguages.join(', ')}`);
      }
    }

    // Validate available_components if provided
    if (requestData.available_components) {
      const validComponents = [
        'html', 'video', 'problem_multiple_choice', 'problem_checkbox',
        'problem_dropdown', 'problem_numerical', 'problem_text_input', 'image', 'interactive_html'
      ];
      const invalidComponents = requestData.available_components.filter(
        component => !validComponents.includes(component)
      );
      if (invalidComponents.length > 0) {
        throw new Error(`Invalid components: ${invalidComponents.join(', ')}. Valid components: ${validComponents.join(', ')}`);
      }
    }

    const config = getConfig();
    const baseUrl = config.STUDIO_BASE_URL;

    if (!baseUrl) {
      throw new Error('STUDIO_BASE_URL is not configured. Please check your environment configuration.');
    }

    const apiType = config.BLENDX_AICC_API_TYPE;
    const url = `${baseUrl}/${apiType}/api/course-creator/`;
    console.log('Making request to:', url);
    console.log('Request data:', requestData);

    const response = await getAuthenticatedHttpClient().post(url, requestData);
    return response;
  } catch (error) {
    console.error('Course Creator API Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    throw error;
  }
};
