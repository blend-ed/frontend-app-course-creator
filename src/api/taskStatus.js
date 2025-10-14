import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

export const getTaskStatus = async (taskId) => {
  try {
    const config = getConfig();
    const baseUrl = config.STUDIO_BASE_URL;

    if (!baseUrl) {
      throw new Error('STUDIO_BASE_URL is not configured. Please check your environment configuration.');
    }

    const apiType = config.BLENDX_AICC_API_TYPE;
    const url = `${baseUrl}/${apiType}/api/task-status/${taskId}/`;
    console.log('Making request to:', url);

    const response = await getAuthenticatedHttpClient().get(url);
    return response;
  } catch (error) {
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    throw error;
  }
};