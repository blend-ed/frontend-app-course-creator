import { Badge, Button, Form, Spinner, Stack } from '@edx/paragon';
import { FilePresent } from '@edx/paragon/icons';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

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
  handleKeyDown,
  isUploading,
  regenerateComment,
  setRegenerateComment,
  handleRegenerateStructure,
  handleCancel,
  isResponseLoading,
  courseData,
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
    return shouldShowOptions;
  }, [shouldShowOptions]);

  // Get file type icon based on file extension
  const getFileTypeIcon = (fileName) => {
    if (!fileName) return FilePresent;
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
      case 'pptx':
      case 'ppt':
      case 'docx':
      case 'doc':
        return FilePresent;
      default:
        return FilePresent;
    }
  };


  // Render message content
  const renderMessage = (message, index) => (
    <div
      key={index}
      className={`p-3 mb-3 rounded ${message.type === 'user'
        ? 'bg-primary text-white ms-auto'
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
              <Spinner animation="border" size="sm" className="me-2" />
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
        <Stack direction="horizontal" gap={2} className="justify-content-end">
          <Button variant="primary" onClick={() => chatHandlers.handleChatResponse('Yes, generate it!')}>
            Generate Course
          </Button>
        </Stack>
      );
    }

    const showAIDecideButton = !['components', 'assessmentTypes'].includes(currentStep);

    return (
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button
          variant="outline-secondary"
          onClick={() => chatHandlers.handleChatResponse('Skip')}
          size="sm"
        >
          Skip
        </Button>
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

    return renderOptions();
  };

  // Main component render
  return (
    <div className="d-flex flex-column h-100">
      <div className="flex-grow-1 overflow-auto p-4" ref={messagesContainerRef} style={{ maxHeight: '70vh' }}>
        {chatMessages.map(renderMessage)}
        {(isGenerating || isResponseLoading) && (
          <div className="p-3 mb-3 rounded bg-light">
            <Spinner animation="border" size="sm" className="me-2" />
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
};

export default ChatInterface;

