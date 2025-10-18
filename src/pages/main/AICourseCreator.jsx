import { Container, Stack } from '@openedx/paragon';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  HeroSection,
  ChatFlow,
  StructureView,
  GenerationProgressModal
} from '../../components/ai-course-creator';
import { durationToCourseSize } from '../../components/ai-course-creator/utils/durationMapping';
import { createCourse } from '../../api/courseCreator';

const AICourseCreator = () => {
  // Helper function to map user-friendly component names to API component names
  const mapComponentsToApiFormat = (userComponents, assessmentTypes = []) => {
    const componentMapping = {
      'Text': 'html',
      'Video Content': 'video',
      'Images': 'image',
      'Interactive Content': 'interactive_html',
    };

    const assessmentMapping = {
      'Multiple Choice': 'problem_multiple_choice',
      'Checkbox Questions': 'problem_checkbox',
      'Text Input Questions': 'problem_text_input',
      'Dropdown Questions': 'problem_dropdown',
      'Numerical Problems': 'problem_numerical'
    };

    const mappedComponents = userComponents
      .map(component => componentMapping[component])
      .filter(component => component !== undefined);

    const mappedAssessments = assessmentTypes
      .map(assessment => assessmentMapping[assessment])
      .filter(assessment => assessment !== undefined);

    const validApiComponents = ['html', 'image', 'video', 'problem_multiple_choice', 'problem_checkbox', 'problem_text_input', 'problem_dropdown', 'problem_numerical', 'interactive_html'];

    let apiComponents = [...new Set([...mappedComponents, ...mappedAssessments])];

    if (!apiComponents.includes('html')) {
      apiComponents.push('html');
    }

    return apiComponents.filter(component => validApiComponents.includes(component));
  };

  // Main course state
  const [courseTopic, setCourseTopic] = useState('');
  const [chatMode, setChatMode] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState('topic');
  const [courseData, setCourseData] = useState({
    topic: '',
    document: null,
    audience: '',
    duration: '',
    components: [],
    imageSource: '',
    videoSource: '',
    assessmentTypes: [],
    documents: [],
    instructions: ''
  });

  // UI state
  const [multiSelectState, setMultiSelectState] = useState({
    isActive: false,
    selectedItems: [],
    step: null
  });
  const [selectedOptions, setSelectedOptions] = useState({});

  // Generation state
  const [submitted, setSubmitted] = useState(false);
  const [courseStructure, setCourseStructure] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResponseLoading, setIsResponseLoading] = useState(false);

  // File handling state
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [documentPaths, setDocumentPaths] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Modal and form state
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);

  // Input handling
  const [regenerateComment, setRegenerateComment] = useState('');

  // Animation control
  const [shouldAnimateStructure, setShouldAnimateStructure] = useState(false);
  const [isEditingStructure, setIsEditingStructure] = useState(false);

  // Race condition protection
  const generationControllerRef = useRef(null);
  const regenerationControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Component mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (generationControllerRef.current) {
        generationControllerRef.current.abort();
      }
      if (regenerationControllerRef.current) {
        regenerationControllerRef.current.abort();
      }
    };
  }, []);

  const handleTopicSubmit = useCallback(() => {
    if (courseTopic.trim()) {
      setCourseData(prev => ({ ...prev, topic: courseTopic }));
      setChatMode(true);
      setChatMessages([
        { type: 'user', content: `Create a course on "${courseTopic}".` },
        { type: 'assistant', content: 'Do you have a document (like a PDF or PPT) to base your course content on? This can help me generate it more accurately. You can drag and drop a file below or click to skip.' }
      ]);
      setCurrentStep('document');
    }
  }, [courseTopic]);

  const hasMeaningfulValue = (value) => {
    if (!value) return false;
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      return trimmedValue !== '' && trimmedValue !== 'Skip' && trimmedValue !== 'Let AI decide';
    }
    if (Array.isArray(value)) {
      return value.length > 0 && !value.includes('Skip') && !value.includes('Let AI decide');
    }
    return Boolean(value);
  };

  const handleGenerateCourse = useCallback(async () => {
    if (isGenerating || !isMountedRef.current) return;

    if (generationControllerRef.current) {
      generationControllerRef.current.abort();
    }

    setIsGenerating(true);
    setSubmitted(true);

    generationControllerRef.current = new AbortController();

    setChatMessages(prev => [...prev,
    { type: 'assistant', content: 'Great! I\'m building your course structure now. This might take a minute...', isGenerating: true }
    ]);

    try {
      const payload = {
        action: 'create_structure',
        topic: courseData.topic,
        available_components: mapComponentsToApiFormat(courseData.components, courseData.assessmentTypes),
      };

      if (hasMeaningfulValue(courseData.audience) || courseData.audience === 'Let AI decide') payload.audience = courseData.audience;
      if (hasMeaningfulValue(courseData.duration) || courseData.duration === 'ai-generated') payload.course_size = durationToCourseSize(courseData.duration);
      if (hasMeaningfulValue(courseData.imageSource)) payload.image_source = courseData.imageSource;
      if (hasMeaningfulValue(courseData.videoSource)) payload.video_source = courseData.videoSource;
      if (documentPaths && documentPaths.length > 0) payload.attachment_paths = documentPaths;
      if (hasMeaningfulValue(courseData.instructions)) payload.instructions = courseData.instructions;

      const response = await createCourse(payload);

      if (generationControllerRef.current.signal.aborted || !isMountedRef.current) {
        return;
      }

      if (!response.data || !response.data.course_structure) {
        throw new Error('Invalid response from server. Please try again.');
      }

      if (generationControllerRef.current && !generationControllerRef.current.signal.aborted && isMountedRef.current) {
        setCourseStructure(response.data.course_structure);
        setShouldAnimateStructure(true);

        setChatMessages(prev => prev.filter(msg => !msg.isGenerating).concat([
          { type: 'assistant', content: 'Perfect! I\'ve created your course structure. You can review it and make any necessary edits. Would you like me to modify anything?' }
        ]));

        setCurrentStep('structure-review');
      }

    } catch (error) {
      if (error.name === 'AbortError' || !isMountedRef.current) {
        return;
      }

      console.error('Error creating course structure:', error);
      console.error('Error response data:', error.response?.data);

      if (isMountedRef.current) {
        // Check if this is a "pending task" scenario
        const errorData = error.response?.data;
        console.log('Checking for pending task:', {
          message: errorData?.message,
          task_id: errorData?.task_id,
          fullErrorData: errorData
        });

        if ((errorData?.message === 'AI course creation is already pending' ||
          errorData?.message?.includes('already pending') ||
          errorData?.error?.includes('already pending')) &&
          errorData?.task_id) {
          // Store the task_id for later use
          setCurrentTaskId(errorData.task_id);

          setChatMessages(prev => prev.filter(msg => !msg.isGenerating).concat([
            {
              type: 'assistant',
              content: 'I found that a course generation is already in progress. You can retry creating the structure, check the progress of the ongoing task, or start over with a new topic.',
              options: ['Retry', 'View Progress', 'Start Over']
            }
          ]));

          setCurrentStep('pending-task');
          setSubmitted(false); // Keep user in chat interface
        } else {
          let errorMessage = 'Something went wrong while generating your course. Please try again.';

          setChatMessages(prev => prev.filter(msg => !msg.isGenerating).concat([
            { type: 'error', content: errorMessage },
            { type: 'assistant', content: 'Would you like to try generating the course again, or would you like to modify something first?', options: ['Try Again', 'Modify Course Setup', 'Start Over'] }
          ]));

          setCurrentStep('generation-error');
          setSubmitted(false);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
      generationControllerRef.current = null;
    }
  }, [isGenerating, courseData, documentPaths, hasMeaningfulValue]);

  const handleRegenerateStructure = useCallback(async () => {
    if (!regenerateComment.trim() || !isMountedRef.current) return;

    if (isResponseLoading) return;

    if (regenerationControllerRef.current) {
      regenerationControllerRef.current.abort();
    }

    setIsGenerating(true);
    setIsResponseLoading(true);

    regenerationControllerRef.current = new AbortController();

    setChatMessages(prev => [...prev,
    { type: 'user', content: regenerateComment },
    { type: 'assistant', content: 'I\'m regenerating your course structure with your feedback. This might take a moment...', isGenerating: true }
    ]);

    try {
      const payload = {
        action: 'update_structure',
        topic: courseData.topic,
        available_components: mapComponentsToApiFormat(courseData.components, courseData.assessmentTypes),
        instructions: regenerateComment,
        course_structure: courseStructure,
      };

      if (hasMeaningfulValue(courseData.audience) || courseData.audience === 'Let AI decide') payload.audience = courseData.audience;
      if (hasMeaningfulValue(courseData.duration) || courseData.duration === 'ai-generated') payload.course_size = durationToCourseSize(courseData.duration);
      if (hasMeaningfulValue(courseData.imageSource)) payload.image_source = courseData.imageSource;
      if (hasMeaningfulValue(courseData.videoSource)) payload.video_source = courseData.videoSource;
      if (documentPaths && documentPaths.length > 0) payload.attachment_paths = documentPaths;

      const response = await createCourse(payload);

      if (regenerationControllerRef.current.signal.aborted || !isMountedRef.current) {
        return;
      }

      if (!response.data || !response.data.course_structure) {
        throw new Error('Invalid response from server. Please try again.');
      }

      if (regenerationControllerRef.current && !regenerationControllerRef.current.signal.aborted && isMountedRef.current) {
        const processedStructure = {
          ...response.data.course_structure.course_structure,
          _hasIds: false
        };

        setCourseStructure(processedStructure);
        setShouldAnimateStructure(true);

        setChatMessages(prev => prev.filter(msg => !msg.isGenerating).concat([
          { type: 'assistant', content: 'Great! I\'ve updated your course structure based on your feedback. How does it look now?' }
        ]));

        setRegenerateComment('');
        setCurrentStep('structure-review');
      }

    } catch (error) {
      if (error.name === 'AbortError' || !isMountedRef.current) {
        return;
      }

      console.error('Error regenerating course structure:', error);

      let errorMessage = 'Something went wrong while regenerating your course. Please try again.';

      if (isMountedRef.current) {
        setChatMessages(prev => prev.filter(msg => !msg.isGenerating).concat([
          { type: 'error', content: errorMessage },
          { type: 'assistant', content: 'Would you like to try regenerating again with different feedback, or would you like to start over?', options: ['Try Again', 'Start Over'] }
        ]));
      }

    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
        setIsResponseLoading(false);
      }
      regenerationControllerRef.current = null;
    }
  }, [regenerateComment, isResponseLoading, courseData, courseStructure, documentPaths, hasMeaningfulValue]);

  const handleAnimationTriggered = useCallback(() => {
    setShouldAnimateStructure(false);
  }, []);

  const handleStructureApproval = useCallback(async (formData) => {
    if (!courseStructure || !isMountedRef.current) {
      return;
    }

    try {
      const payload = {
        action: 'create_content',
        topic: courseData.topic,
        course_structure: courseStructure,
        available_components: mapComponentsToApiFormat(courseData.components, courseData.assessmentTypes),
      };

      if (hasMeaningfulValue(courseData.audience) || courseData.audience === 'Let AI decide') payload.audience = courseData.audience;
      if (hasMeaningfulValue(courseData.duration) || courseData.duration === 'ai-generated') payload.course_size = durationToCourseSize(courseData.duration);
      if (hasMeaningfulValue(courseData.imageSource)) payload.image_source = courseData.imageSource;
      if (hasMeaningfulValue(courseData.videoSource)) payload.video_source = courseData.videoSource;
      if (documentPaths && documentPaths.length > 0) payload.attachment_paths = documentPaths;
      if (hasMeaningfulValue(courseData.instructions)) payload.instructions = courseData.instructions;

      const response = await createCourse(payload);

      if (isMountedRef.current) {
        // Extract task_id from response if available
        const taskId = response.data?.task_id;
        setShowGenerationModal(true);
        // Pass task_id to modal if available
        if (taskId) {
          setCurrentTaskId(taskId);
        }
      }

    } catch (error) {
      console.error('Error submitting course for generation:', error);
      console.error('Error response data:', error.response?.data);

      if (isMountedRef.current) {
        // Check if this is a "pending task" scenario
        const errorData = error.response?.data;
        console.log('Checking for pending task in approval:', {
          message: errorData?.message,
          task_id: errorData?.task_id,
          fullErrorData: errorData
        });

        if ((errorData?.message === 'AI course creation is already pending' ||
          errorData?.message?.includes('already pending') ||
          errorData?.error?.includes('already pending')) &&
          errorData?.task_id) {
          // Store the task_id for later use
          setCurrentTaskId(errorData.task_id);

          setChatMessages(prev => [...prev,
          {
            type: 'assistant',
            content: 'I found that a course generation is already in progress. You can retry creating the structure, check the progress of the ongoing task, or start over with a new topic.',
            options: ['Retry', 'View Progress', 'Start Over']
          }
          ]);

          setCurrentStep('pending-task');
        } else {
          setChatMessages(prev => [...prev,
          { type: 'error', content: `Failed to submit course for generation: ${error.message}` },
          { type: 'assistant', content: 'Would you like to try submitting again?', options: ['Try Again', 'Start Over'] }
          ]);
        }
      }
    }
  }, [courseData, courseStructure, documentPaths, hasMeaningfulValue]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chatMode) {
        handleTopicSubmit();
      }
    }
  }, [chatMode, handleTopicSubmit]);

  const handleCancel = useCallback(() => {
    if (generationControllerRef.current) {
      generationControllerRef.current.abort();
    }
    if (regenerationControllerRef.current) {
      regenerationControllerRef.current.abort();
    }

    setChatMode(false);
    setShowGenerationModal(false);
    setIsResponseLoading(false);
    setIsGenerating(false);
    setSubmitted(false);
    setCourseStructure(null);
    setChatMessages([]);
    setCurrentStep('topic');
    setCourseData({
      topic: '',
      document: null,
      audience: '',
      duration: '',
      components: [],
      imageSource: '',
      videoSource: '',
      assessmentTypes: [],
      documents: [],
      instructions: ''
    });
    setMultiSelectState({
      isActive: false,
      selectedItems: [],
      step: null
    });
    setSelectedOptions({});
    setDocumentPaths(null);
    setAttachedFiles([]);
    setCourseTopic('');
    setRegenerateComment('');
  }, []);

  const handleViewProgress = useCallback(() => {
    if (currentTaskId) {
      setShowGenerationModal(true);
    }
  }, [currentTaskId]);

  // Show structure view when course is generated
  if (submitted) {
    return (
      <Container fluid>
        <div className="d-flex gap-4" style={{ minHeight: '100vh' }}>
          <div style={{ flex: '1', maxWidth: '40%' }}>
            <ChatFlow
              courseTopic={courseTopic}
              courseData={courseData}
              setCourseData={setCourseData}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              multiSelectState={multiSelectState}
              setMultiSelectState={setMultiSelectState}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
              documentPaths={documentPaths}
              setDocumentPaths={setDocumentPaths}
              attachedFiles={attachedFiles}
              setAttachedFiles={setAttachedFiles}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
              submitted={submitted}
              setSubmitted={setSubmitted}
              handleGenerateCourse={handleGenerateCourse}
              handleCancel={handleCancel}
              regenerateComment={regenerateComment}
              setRegenerateComment={setRegenerateComment}
              handleRegenerateStructure={handleRegenerateStructure}
              isResponseLoading={isResponseLoading}
            />
          </div>
          <div style={{ flex: '1' }}>
            <StructureView
              structure={courseStructure}
              setStructure={setCourseStructure}
              isGenerating={isGenerating}
              isResponseLoading={isResponseLoading}
              handleStructureApproval={handleStructureApproval}
              triggerAnimation={shouldAnimateStructure}
              onAnimationTriggered={handleAnimationTriggered}
              isEditingStructure={isEditingStructure}
              setIsEditingStructure={setIsEditingStructure}
            />
          </div>
        </div>
        <GenerationProgressModal
          show={showGenerationModal}
          setShowGenerationModal={setShowGenerationModal}
          taskId={currentTaskId}
          handleCancel={handleCancel}
        />
      </Container>
    );
  }

  // Show chat interface
  if (chatMode) {
    return (
      <>
        <ChatFlow
          courseTopic={courseTopic}
          courseData={courseData}
          setCourseData={setCourseData}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          multiSelectState={multiSelectState}
          setMultiSelectState={setMultiSelectState}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          documentPaths={documentPaths}
          setDocumentPaths={setDocumentPaths}
          attachedFiles={attachedFiles}
          setAttachedFiles={setAttachedFiles}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
          submitted={submitted}
          setSubmitted={setSubmitted}
          handleGenerateCourse={handleGenerateCourse}
          handleCancel={handleCancel}
          regenerateComment={regenerateComment}
          setRegenerateComment={setRegenerateComment}
          handleRegenerateStructure={handleRegenerateStructure}
          isResponseLoading={isResponseLoading}
          handleViewProgress={handleViewProgress}
        />
        <GenerationProgressModal
          show={showGenerationModal}
          setShowGenerationModal={setShowGenerationModal}
          taskId={currentTaskId}
          handleCancel={() => setShowGenerationModal(false)}
        />
      </>
    );
  }

  // Show initial simple topic input screen
  return (
    <HeroSection
      courseTopic={courseTopic}
      setCourseTopic={setCourseTopic}
      handleTopicSubmit={handleTopicSubmit}
      handleKeyDown={handleKeyDown}
    />
  );
};

export default AICourseCreator;

