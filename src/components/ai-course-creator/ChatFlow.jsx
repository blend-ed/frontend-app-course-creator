import { useRef, useState, useEffect, useCallback } from 'react';
import { Container, Row, Col } from '@openedx/paragon';
import PropTypes from 'prop-types';
import { uploadAttachment } from '../../api/attachments';
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
  documentPaths,
  setDocumentPaths,
  attachedFiles,
  setAttachedFiles,
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
  isResponseLoading,
  handleViewProgress
}) => {
  const chatInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const uploadControllerRef = useRef(null);

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
    documentPaths,
    setDocumentPaths,
    attachedFiles,
    setAttachedFiles,
    setIsUploading,
    handleGenerateCourse,
    handleCancel,
    handleViewProgress
  });

  // Process file upload
  const processFileUpload = useCallback(async (file) => {
    if (isUploading) {
      setChatMessages(prev => [...prev,
      { type: 'error', content: 'Please wait for the current upload to complete before uploading more files.' }
      ]);
      return;
    }

    setIsUploading(true);

    setChatMessages(prev => [...prev,
    { type: 'user', content: `Uploading: ${file.name}` },
    { type: 'assistant', content: `I'm processing your document. This may take a few moments...`, isUploading: true }
    ]);

    try {
      const response = await uploadAttachment(file, `Course material: ${file.name}`);

      if (!response.data || !response.data.attachment) {
        throw new Error('Invalid response from server');
      }

      const attachment = response.data.attachment;

      // Store attachment with its metadata
      const attachmentData = {
        id: attachment.id,
        filename: attachment.filename,
        file_path: attachment.file_path,
        file_size_mb: attachment.file_size_mb,
        file_type: attachment.file_type,
        file_extension: attachment.file_extension,
        created: attachment.created
      };

      setAttachedFiles(prev => [...prev, attachmentData]);
      setCourseData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), attachmentData]
      }));

      // Store file path for course creation API
      if (attachment.file_path) {
        setDocumentPaths(prev => [...(prev || []), attachment.file_path]);
      }

      setChatMessages(prev => prev.filter(msg => !msg.isUploading).concat([
        { type: 'assistant', content: `✓ Successfully processed "${file.name}"`, hasAttachment: true, attachmentName: file.name },
        { type: 'assistant', content: `Perfect! I've successfully processed your document. I'll use this document to create more accurate course content.` },
        { type: 'assistant', content: "Now, who's your course for? Pick a target audience or let me decide.", options: ['Beginners', 'Intermediate', 'Advanced', 'Let AI decide'] }
      ]));

      setCurrentStep('audience');

    } catch (error) {
      console.error('Error uploading attachment:', error);

      let errorMessage = 'Upload failed. ';
      if (error.response?.status === 413) {
        errorMessage += 'File is too large. Please upload a smaller file (max 50MB).';
      } else if (error.response?.status === 400) {
        const apiError = error.response?.data?.error || error.response?.data?.message;
        errorMessage += apiError || 'Invalid document file. Please upload a supported file format.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      setChatMessages(prev => prev.filter(msg => !msg.isUploading).concat([
        { type: 'error', content: errorMessage },
        { type: 'assistant', content: 'Would you like to try uploading the document again, or should we continue without it?', options: ['Try Upload Again', 'Continue Without Documents'] }
      ]));
      setCurrentStep('document-retry');
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, setChatMessages, setAttachedFiles, setCourseData, setCurrentStep, setIsUploading, setDocumentPaths]);

  // Handle file upload success callback
  const handleFileUploadSuccess = useCallback((fileData, responseData) => {
    if (!responseData || !responseData.attachment) {
      console.error('Invalid attachment response');
      return;
    }

    const attachment = responseData.attachment;

    // Store attachment with its metadata
    const attachmentData = {
      id: attachment.id,
      filename: attachment.filename,
      file_path: attachment.file_path,
      file_size_mb: attachment.file_size_mb,
      file_type: attachment.file_type,
      file_extension: attachment.file_extension,
      created: attachment.created
    };

    setAttachedFiles(prev => [...prev, attachmentData]);
    setCourseData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), attachmentData]
    }));

    if (attachment.file_path) {
      setDocumentPaths(prev => [...(prev || []), attachment.file_path]);
    }

    setChatMessages(prev => [...prev,
    { type: 'assistant', content: `✓ Successfully processed "${attachment.filename}"`, hasAttachment: true, attachmentName: attachment.filename },
    { type: 'assistant', content: `Perfect! I've successfully processed your document. I'll use this document to create more accurate course content.` },
    { type: 'assistant', content: "Now, who's your course for? Pick a target audience or let me decide.", options: ['Beginners', 'Intermediate', 'Advanced', 'Let AI decide'] }
    ]);

    setCurrentStep('audience');
  }, [setAttachedFiles, setCourseData, setDocumentPaths, setChatMessages, setCurrentStep]);

  // Handle file upload error callback
  const handleFileUploadError = useCallback((error) => {
    let errorMessage = 'Upload failed. ';
    if (error.response?.status === 413) {
      errorMessage += 'File is too large. Please upload a smaller file (max 50MB).';
    } else if (error.response?.status === 400) {
      const apiError = error.response?.data?.error || error.response?.data?.message;
      errorMessage += apiError || 'Invalid document file. Please upload a supported file format.';
    } else {
      errorMessage += error.message || 'Please try again.';
    }

    setChatMessages(prev => [...prev,
    { type: 'error', content: errorMessage },
    { type: 'assistant', content: 'Would you like to try uploading the document again, or should we continue without it?', options: ['Try Upload Again', 'Continue Without Documents'] }
    ]);
    setCurrentStep('document-retry');
  }, [setChatMessages, setCurrentStep]);

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

  // Cleanup
  useEffect(() => {
    return () => {
      if (uploadControllerRef.current) {
        uploadControllerRef.current.abort();
      }
    };
  }, []);

  const lastMessageWithOptions = [...chatMessages].reverse().find(msg => msg.options);

  if (!submitted) {
    return (
      <Container fluid>
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
              onFileUploadSuccess={handleFileUploadSuccess}
              onFileUploadError={handleFileUploadError}
            />
          </Col>
          <Col lg={3}>
            <ChatSidebar
              courseData={courseData}
              setCourseData={setCourseData}
              attachedFiles={attachedFiles}
              setAttachedFiles={setAttachedFiles}
              multiSelectState={multiSelectState}
              setMultiSelectState={setMultiSelectState}
              onFileUpload={processFileUpload}
              documentPaths={documentPaths}
              setDocumentPaths={setDocumentPaths}
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
        onFileUploadSuccess={handleFileUploadSuccess}
        onFileUploadError={handleFileUploadError}
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
  documentPaths: PropTypes.array,
  setDocumentPaths: PropTypes.func.isRequired,
  attachedFiles: PropTypes.array.isRequired,
  setAttachedFiles: PropTypes.func.isRequired,
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
  handleViewProgress: PropTypes.func,
};

export default ChatFlow;

