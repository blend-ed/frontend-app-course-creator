import { useRef, useEffect, useCallback } from 'react';
import { Container, Row, Col } from '@edx/paragon';
import PropTypes from 'prop-types';
import { createChatHandlers } from './utils/chatHandlers';
import ChatSidebar from './ChatSidebar';
import ChatInterface from './ChatInterface';

const ChatFlow = ({
  courseTopic,
  courseData,
  setCourseData,
  chatMessages,
  setChatMessages,
  currentStep,
  setCurrentStep,
  multiSelectState,
  setMultiSelectState,
  selectedOptions,
  setSelectedOptions,
  isGenerating,
  setIsGenerating,
  isUploading,
  setIsUploading,
  submitted,
  setSubmitted,
  handleGenerateCourse,
  handleCancel,
  regenerateComment,
  setRegenerateComment,
  handleRegenerateStructure,
  isResponseLoading
}) => {
  const chatInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 1;
      if (isScrolledToBottom || chatMessages.length > 0) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [chatMessages]);

  // Create chat handlers
  const chatHandlers = createChatHandlers({
    courseData,
    setCourseData,
    chatMessages,
    setChatMessages,
    currentStep,
    setCurrentStep,
    multiSelectState,
    setMultiSelectState,
    selectedOptions,
    setSelectedOptions,
    setIsUploading,
    handleGenerateCourse,
    handleCancel
  });


  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const input = chatInputRef.current;
      if (input && input.value.trim()) {
        chatHandlers.handleChatResponse(input.value);
        input.value = '';
      }
    }
  }, [chatHandlers]);


  const lastMessageWithOptions = [...chatMessages].reverse().find(msg => msg.options);

  if (!submitted) {
    return (
      <Container fluid className="py-4">
        <Row>
          <Col lg={3} className="d-none d-lg-block" />
          <Col lg={6}>
            <ChatInterface
              chatMessages={chatMessages}
              messagesContainerRef={messagesContainerRef}
              isGenerating={isGenerating}
              submitted={submitted}
              currentStep={currentStep}
              lastMessageWithOptions={lastMessageWithOptions}
              selectedOptions={selectedOptions}
              multiSelectState={multiSelectState}
              chatHandlers={chatHandlers}
              chatInputRef={chatInputRef}
              handleKeyDown={handleKeyDown}
              isUploading={isUploading}
              regenerateComment={regenerateComment}
              setRegenerateComment={setRegenerateComment}
              handleRegenerateStructure={handleRegenerateStructure}
              handleCancel={handleCancel}
              isResponseLoading={isResponseLoading}
              courseData={courseData}
              setCourseData={setCourseData}
            />
          </Col>
          <Col lg={3}>
            <ChatSidebar
              courseData={courseData}
              setCourseData={setCourseData}
              multiSelectState={multiSelectState}
              setMultiSelectState={setMultiSelectState}
              currentStep={currentStep}
            />
          </Col>
        </Row>
      </Container>
    );
  } else {
    return (
      <ChatInterface
        chatMessages={chatMessages}
        messagesContainerRef={messagesContainerRef}
        isGenerating={isGenerating}
        submitted={submitted}
        currentStep={currentStep}
        lastMessageWithOptions={lastMessageWithOptions}
        selectedOptions={selectedOptions}
        multiSelectState={multiSelectState}
        chatHandlers={chatHandlers}
        chatInputRef={chatInputRef}
        handleKeyDown={handleKeyDown}
        isUploading={isUploading}
        regenerateComment={regenerateComment}
        setRegenerateComment={setRegenerateComment}
        handleRegenerateStructure={handleRegenerateStructure}
        handleCancel={handleCancel}
        isResponseLoading={isResponseLoading}
        courseData={courseData}
        setCourseData={setCourseData}
      />
    );
  }
};

ChatFlow.propTypes = {
  courseTopic: PropTypes.string,
  courseData: PropTypes.object.isRequired,
  setCourseData: PropTypes.func.isRequired,
  chatMessages: PropTypes.array.isRequired,
  setChatMessages: PropTypes.func.isRequired,
  currentStep: PropTypes.string.isRequired,
  setCurrentStep: PropTypes.func.isRequired,
  multiSelectState: PropTypes.object.isRequired,
  setMultiSelectState: PropTypes.func.isRequired,
  selectedOptions: PropTypes.object.isRequired,
  setSelectedOptions: PropTypes.func.isRequired,
  isGenerating: PropTypes.bool,
  setIsGenerating: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  setIsUploading: PropTypes.func.isRequired,
  submitted: PropTypes.bool,
  setSubmitted: PropTypes.func,
  handleGenerateCourse: PropTypes.func.isRequired,
  handleCancel: PropTypes.func.isRequired,
  regenerateComment: PropTypes.string,
  setRegenerateComment: PropTypes.func,
  handleRegenerateStructure: PropTypes.func,
  isResponseLoading: PropTypes.bool,
};

export default ChatFlow;

