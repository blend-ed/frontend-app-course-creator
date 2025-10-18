import { Badge, Button, Dropzone, Form, Spinner, Stack } from '@openedx/paragon';
import { FilePresent } from '@openedx/paragon/icons';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

const ChatInterface = ({
  chatMessages,
  messagesContainerRef,
  isGenerating,
  submitted,
  currentStep,
  lastMessageWithOptions,
  selectedOptions,
  multiSelectState,
  chatHandlers,
  chatInputRef,
  regenerateComment,
  setRegenerateComment,
  handleRegenerateStructure,
  handleCancel,
  isResponseLoading,
  setCourseData,
  onFileUploadSuccess,
  onFileUploadError
}) => {

  // State to track the current input value
  const [inputValue, setInputValue] = useState('');

  // Memoized computed values
  const shouldShowInput = useMemo(() => !submitted, [submitted]);
  const shouldShowRegenerationControls = useMemo(() => submitted, [submitted]);
  const shouldShowOptions = useMemo(() => lastMessageWithOptions && !isGenerating, [lastMessageWithOptions, isGenerating]);
  const shouldShowActionButtons = useMemo(() => {
    return shouldShowOptions || (currentStep === 'document' && !isGenerating);
  }, [shouldShowOptions, currentStep, isGenerating]);

  // Handle file upload for Paragon Dropzone
  const handleProcessUpload = async ({ fileData, requestConfig, handleError }) => {
    try {
      console.log('Processing upload, fileData type:', typeof fileData, fileData);

      // fileData from Paragon Dropzone is ALREADY a FormData object
      // We need to extract the file and add our description
      const file = fileData.get('file'); // Get the actual File object

      console.log('Extracted file:', file);
      console.log('File details:', file?.name, file?.type, file?.size);

      // Create our FormData with the file and description
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', `Course material: ${file?.name || 'unknown'}`);

      // Log FormData contents for debugging
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], '=', pair[1]);
      }

      // Use the attachment API with requestConfig for progress tracking
      const envConfig = getConfig();
      const baseUrl = envConfig.STUDIO_BASE_URL;
      const apiType = envConfig.BLENDX_AICC_API_TYPE;
      const url = `${baseUrl}/${apiType}/api/attachments/`;

      console.log('Uploading to:', url);

      // Merge requestConfig but ensure we don't override Content-Type
      const axiosConfig = {
        ...requestConfig,
        headers: {
          ...(requestConfig?.headers || {}),
        }
      };

      // Explicitly delete Content-Type to let browser set it with boundary
      if (axiosConfig.headers['Content-Type']) {
        delete axiosConfig.headers['Content-Type'];
      }
      if (axiosConfig.headers['content-type']) {
        delete axiosConfig.headers['content-type'];
      }

      console.log('Request config:', axiosConfig);

      const response = await getAuthenticatedHttpClient().post(url, formData, axiosConfig);

      console.log('Upload successful:', response.data);

      // Call success callback with the actual file object (not FormData)
      if (onFileUploadSuccess) {
        onFileUploadSuccess(file, response.data);
      }

      return response;
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      handleError(error);
      if (onFileUploadError) {
        onFileUploadError(error);
      }
      throw error;
    }
  };

  console.log('currentStep', currentStep);

  // Render message content
  const renderMessage = (message, index) => (
    <div
      key={index}
      className={`p-3 mb-3 rounded ${message.type === 'user'
        ? 'bg-primary text-white ml-auto'
        : message.type === 'error'
          ? 'bg-danger text-white'
          : 'bg-light'
        }`}
      style={{
        maxWidth: message.type === 'user' ? '80%' : '100%',
        marginLeft: message.type === 'user' ? 'auto' : '0',
        whiteSpace: 'pre-wrap'
      }}
    >
      {message.content}
      {message.hasAttachment && message.attachmentName && (
        <div className="mt-2">
          <Badge variant="light" className="d-inline-flex align-items-center gap-1">
            <FilePresent />
            <span>{message.attachmentName}</span>
          </Badge>
        </div>
      )}
    </div>
  );

  // Render single select options
  const renderSingleSelectOptions = () => (
    <Stack direction="horizontal" gap={2} className="flex-wrap mb-3">
      {lastMessageWithOptions.options
        .filter(option => option !== 'Let AI decide')
        .map((option, optIndex) => (
          <Button
            key={optIndex}
            variant={selectedOptions[chatMessages.indexOf(lastMessageWithOptions)] === option ? 'primary' : 'outline-primary'}
            onClick={() => chatHandlers.handleChatResponse(option)}
            size="sm"
          >
            {option}
          </Button>
        ))}
    </Stack>
  );

  // Render multi-select options
  const renderMultiSelectOptions = () => (
    <Stack direction="horizontal" gap={2} className="flex-wrap mb-3">
      {lastMessageWithOptions.options.map((option, optIndex) => (
        <Button
          key={optIndex}
          variant={multiSelectState.selectedItems.includes(option) ? 'primary' : 'outline-primary'}
          onClick={() => chatHandlers.handleMultiSelectToggle(option)}
          size="sm"
        >
          {option}
        </Button>
      ))}
    </Stack>
  );

  // Render document dropzone
  const renderDocumentDropzone = () => (
    <div className="mb-3">
      <Dropzone
        onProcessUpload={handleProcessUpload}
        accept={{
          'application/pdf': ['.pdf'],
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'application/msword': ['.doc'],
          'text/plain': ['.txt'],
          'text/markdown': ['.md'],
          'application/rtf': ['.rtf'],
          'application/vnd.ms-powerpoint': ['.ppt'],
          'application/vnd.ms-excel': ['.xls'],
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          'text/csv': ['.csv']
        }}
        maxSize={50 * 1024 * 1024}
        progressVariant="bar"
        errorMessages={{
          invalidType: 'Invalid file type. Please upload PDF, Word, PowerPoint, Excel, or text files.',
          invalidSize: 'The file size must be less than 50MB.',
        }}
      />
    </div>
  );

  // Render text input
  const renderTextInput = (placeholder = "Type your message...") => {
    const handleInputChange = (e) => {
      const value = e.target.value;
      setInputValue(value);

      // Update courseData with instructions when in confirmation step
      if (currentStep === 'confirmation') {
        setCourseData(prev => ({ ...prev, instructions: value }));
      }
    };

    const handleInputKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (inputValue.trim()) {
          chatHandlers.handleChatResponse("Yes, generate it!");
          setInputValue('');
        }
      }
    };

    return (
      <Form.Control
        ref={chatInputRef}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
      />
    );
  };

  // Render regeneration controls
  const renderRegenerationControls = () => (
    <>
      <Form.Control
        as="textarea"
        value={regenerateComment}
        onChange={(e) => setRegenerateComment(e.target.value)}
        placeholder={currentStep === 'structure-review'
          ? "Tell me what you'd like to change about the course structure..."
          : "Provide feedback to regenerate the structure..."
        }
        rows={3}
        className="mb-3"
        onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleRegenerateStructure()}
      />
      <Stack direction="horizontal" gap={2} className="justify-content-between">
        <Button
          onClick={handleCancel}
          variant="outline-secondary"
        >
          Start Over
        </Button>
        <Button
          onClick={handleRegenerateStructure}
          disabled={isGenerating || isResponseLoading || !regenerateComment.trim()}
          variant="primary"
        >
          {isGenerating ? (
            <>
              <Spinner animation="border" size="sm" className="mr-2" />
              Regenerating...
            </>
          ) : (
            'Regenerate Course'
          )}
        </Button>
      </Stack>
    </>
  );

  // Render standard action buttons
  const renderActionButtons = () => {
    if (currentStep === 'generation-error') return null;

    if (currentStep === 'confirmation') {
      return (
        <Stack direction="horizontal" gap={2} className="justify-content-end mt-2.5 mr-2">
          <Button variant="primary" onClick={() => chatHandlers.handleChatResponse('Yes, generate it!')}>
            Generate Course
          </Button>
        </Stack>
      );
    }

    const showAIDecideButton = !['document', 'components', 'assessmentTypes', 'pending-task'].includes(currentStep);
    const showSkipButton = !['pending-task'].includes(currentStep);

    return (
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        {showSkipButton && (
          <Button
            variant="outline-secondary"
            onClick={() => chatHandlers.handleChatResponse('Skip')}
            size="sm"
          >
            Skip
          </Button>
        )}
        {showAIDecideButton && (
          <Button
            variant="outline-primary"
            onClick={() => chatHandlers.handleChatResponse('Let AI decide')}
            size="sm"
          >
            Let AI Decide
          </Button>
        )}
        {multiSelectState.isActive && (
          <Button
            variant="primary"
            onClick={chatHandlers.handleMultiSelectConfirm}
            disabled={!multiSelectState.isActive || multiSelectState.selectedItems.length === 0}
            size="sm"
          >
            Continue {multiSelectState.isActive ? 'with Selected' : ''}
          </Button>
        )}
      </Stack>
    );
  };

  // Render options based on message type
  const renderOptions = () => {
    if (!shouldShowOptions) return null;

    if (lastMessageWithOptions.multiSelect) {
      return renderMultiSelectOptions();
    } else {
      return renderSingleSelectOptions();
    }
  };

  // Determine input content based on current state
  const renderInputContent = () => {
    if (!shouldShowInput) return null;

    if (currentStep === 'confirmation') {
      return renderTextInput("Anything else you want to add?");
    }

    if (currentStep === 'document') {
      return renderDocumentDropzone();
    }

    return renderOptions();
  };

  // Main component render
  return (
    <div className="d-flex flex-column h-100">
      <div className="flex-grow-1 overflow-auto p-4" ref={messagesContainerRef} style={{ maxHeight: '70vh' }}>
        {chatMessages.map(renderMessage)}
        {(isGenerating || isResponseLoading) && (
          <div className="p-3 mb-3 rounded bg-light">
            <Spinner animation="border" size="sm" className="mr-2" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      <div className="border-top p-4">
        {shouldShowRegenerationControls ? renderRegenerationControls() : (
          <>
            {renderInputContent()}
            {shouldShowActionButtons && renderActionButtons()}
          </>
        )}
      </div>
    </div>
  );
};

ChatInterface.propTypes = {
  chatMessages: PropTypes.arrayOf(PropTypes.object).isRequired,
  messagesContainerRef: PropTypes.object,
  isGenerating: PropTypes.bool,
  submitted: PropTypes.bool,
  currentStep: PropTypes.string,
  lastMessageWithOptions: PropTypes.object,
  selectedOptions: PropTypes.object,
  multiSelectState: PropTypes.object,
  chatHandlers: PropTypes.object.isRequired,
  chatInputRef: PropTypes.object,
  handleKeyDown: PropTypes.func,
  isUploading: PropTypes.bool,
  regenerateComment: PropTypes.string,
  setRegenerateComment: PropTypes.func,
  handleRegenerateStructure: PropTypes.func,
  handleCancel: PropTypes.func,
  isResponseLoading: PropTypes.bool,
  courseData: PropTypes.object,
  setCourseData: PropTypes.func,
  onFileUploadSuccess: PropTypes.func,
  onFileUploadError: PropTypes.func,
};

export default ChatInterface;

