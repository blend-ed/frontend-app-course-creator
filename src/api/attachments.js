import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

/**
 * Upload a new attachment file
 * @param {File} file - The file to upload
 * @param {string} description - Optional description of the attachment
 * @returns {Promise<Object>} The API response with attachment details
 */
export const uploadAttachment = async (file, description = '') => {
  try {
    const config = getConfig();
    const baseUrl = config.STUDIO_BASE_URL;
    const url = `${baseUrl}/blendxcoursecreator_enterprise/api/attachments/`;

    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    // Important: Don't set Content-Type header manually - let the browser set it with boundary
    const response = await getAuthenticatedHttpClient().post(url, formData, {
      headers: {
        // Remove any Content-Type header to let the browser set it correctly with boundary
      }
    });
    return response;
  } catch (error) {
    console.error('Attachment upload error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

/**
 * List user's attachments with optional filtering
 * @param {Object} filters - Optional filters
 * @param {string} filters.file_type - Filter by MIME type
 * @param {string} filters.org - Filter by organization
 * @returns {Promise<Object>} List of attachments
 */
export const listAttachments = async (filters = {}) => {
  try {
    const config = getConfig();
    const baseUrl = config.STUDIO_BASE_URL;
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${baseUrl}/blendxcoursecreator_enterprise/api/attachments/${queryParams ? `?${queryParams}` : ''}`;

    const response = await getAuthenticatedHttpClient().get(url);
    return response;
  } catch (error) {
    console.error('List attachments error:', error);
    throw error;
  }
};

/**
 * Get details of a specific attachment
 * @param {number} attachmentId - The attachment ID
 * @returns {Promise<Object>} Attachment details
 */
export const getAttachment = async (attachmentId) => {
  try {
    const config = getConfig();
    const baseUrl = config.STUDIO_BASE_URL;
    const url = `${baseUrl}/blendxcoursecreator_enterprise/api/attachments/${attachmentId}/`;

    const response = await getAuthenticatedHttpClient().get(url);
    return response;
  } catch (error) {
    console.error('Get attachment error:', error);
    throw error;
  }
};

/**
 * Update attachment description
 * @param {number} attachmentId - The attachment ID
 * @param {string} description - New description
 * @returns {Promise<Object>} Updated attachment details
 */
export const updateAttachment = async (attachmentId, description) => {
  try {
    const config = getConfig();
    const baseUrl = config.STUDIO_BASE_URL;
    const url = `${baseUrl}/blendxcoursecreator_enterprise/api/attachments/${attachmentId}/`;

    const response = await getAuthenticatedHttpClient().patch(url, { description });
    return response;
  } catch (error) {
    console.error('Update attachment error:', error);
    throw error;
  }
};

/**
 * Delete a specific attachment
 * @param {number} attachmentId - The attachment ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteAttachment = async (attachmentId) => {
  try {
    const config = getConfig();
    const baseUrl = config.STUDIO_BASE_URL;
    const url = `${baseUrl}/blendxcoursecreator_enterprise/api/attachments/${attachmentId}/`;

    const response = await getAuthenticatedHttpClient().delete(url);
    return response;
  } catch (error) {
    console.error('Delete attachment error:', error);
    throw error;
  }
};

/**
 * Delete multiple attachments at once
 * @param {number[]} attachmentIds - Array of attachment IDs
 * @returns {Promise<Object>} Bulk deletion confirmation
 */
export const bulkDeleteAttachments = async (attachmentIds) => {
  try {
    const config = getConfig();
    const baseUrl = config.STUDIO_BASE_URL;
    const url = `${baseUrl}/blendxcoursecreator_enterprise/api/attachments/bulk-delete/`;

    const response = await getAuthenticatedHttpClient().post(url, {
      attachment_ids: attachmentIds
    });
    return response;
  } catch (error) {
    console.error('Bulk delete attachments error:', error);
    throw error;
  }
};

