/**
 * Chat handlers utility for AI Course Creator
 * Contains functions to handle chat responses and flow management
 */

import { getSmartDefaults } from './smartDefaults';

export const createChatHandlers = ({
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
}) => {

  const handleMultiSelectToggle = (option) => {
    setMultiSelectState(prev => {
      const isSelected = prev.selectedItems.includes(option);
      const newSelectedItems = isSelected
        ? prev.selectedItems.filter(item => item !== option)
        : [...prev.selectedItems, option];

      return {
        ...prev,
        selectedItems: newSelectedItems
      };
    });
  };

  const handleMultiSelectConfirm = () => {
    const { selectedItems, step } = multiSelectState;

    if (selectedItems.length === 0) {
      setChatMessages(prev => [...prev,
      { type: 'assistant', content: 'Please select at least one option, or choose "Let AI decide" if you want me to choose for you.' }
      ]);
      return;
    }

    setMultiSelectState({
      isActive: false,
      selectedItems: [],
      step: null
    });

    handleChatResponse(selectedItems, 'multiselect');
  };

  const handleSmartSkip = (step) => {
    const defaults = getSmartDefaults(courseData.topic);

    switch (step) {
      case 'audience':
        setCourseData(prev => ({ ...prev, audience: defaults.audience }));
        setChatMessages(prev => [...prev,
        // Let AI decide audience
        { type: 'assistant', content: `You selected "Let AI decide" for audience. I'll choose the best audience for your course based on your other selections.` },
        { type: 'assistant', content: "How long should your course be? Choose an option or let me figure it out.", options: ['Short (1-2 hours)', 'Medium (3-5 hours)', 'Long (6+ hours)', 'Let AI decide'] }
        ]);
        setCurrentStep('duration');
        break;

      case 'duration':
        setCourseData(prev => ({ ...prev, duration: 'ai-generated' }));
        setChatMessages(prev => [...prev,
        { type: 'assistant', content: `Perfect! I'll choose the best duration for your course based on your other selections.` },
        { type: 'assistant', content: "What content components do you want in your course? You can pick multiple options or let me choose for you.", options: ['Text', 'Video Content', 'Images'], multiSelect: true }
        ]);
        setCurrentStep('components');
        setMultiSelectState({
          isActive: true,
          selectedItems: [],
          step: 'components'
        });
        break;

      case 'components':
        setCourseData(prev => ({ ...prev, components: defaults.components }));
        setChatMessages(prev => [...prev,
        { type: 'assistant', content: `Great! I've selected these content components for your course: ${defaults.components.join(', ')}. These work well for your topic.` },
        { type: 'assistant', content: "What types of assessments would you like to include? You can pick multiple options or let me choose for you.", options: ['Multiple Choice', 'Checkbox Questions', 'Text Input Questions', 'Dropdown Questions', 'Numerical Problems'], multiSelect: true }
        ]);
        setCurrentStep('assessmentTypes');
        setMultiSelectState({
          isActive: true,
          selectedItems: [],
          step: 'assessmentTypes'
        });
        break;

      case 'assessmentTypes':
        setCourseData(prev => ({ ...prev, assessmentTypes: defaults.assessmentTypes }));
        setChatMessages(prev => [...prev,
        { type: 'assistant', content: `I've selected these assessment types: ${defaults.assessmentTypes.join(', ')} - they're ideal for your subject matter.` }
        ]);
        goToConfirmation();
        break;
    }
  };

  const goToConfirmation = () => {
    const summary = `Here's your course setup:
Topic: "${courseData.topic}"
Audience: "${courseData.audience}"
Duration: "${courseData.duration}"
Content Components: ${courseData.components.join(', ')}
${courseData.assessmentTypes.length > 0 ? `Assessment Types: ${courseData.assessmentTypes.join(', ')}` : 'Assessment Types: None'}

Ready to generate your course?`;

    setChatMessages(prev => [...prev,
    { type: 'assistant', content: summary }
    ]);
    setCurrentStep('confirmation');
  };

  const handleErrorRecovery = (action) => {
    switch (action) {
      case 'Try Again':
        handleGenerateCourse();
        break;
      case 'Modify Course Setup':
        goToConfirmation();
        break;
      case 'Start Over':
        handleCancel();
        break;
      default:
        break;
    }
  };

  const handleChatResponse = async (response, type = 'text') => {
    // Track selected option for non-multiselect responses
    if (type === 'text' && typeof response === 'string') {
      const messageIndex = chatMessages.findIndex(msg =>
        msg.options && msg.options.includes(response) && !msg.multiSelect
      );
      if (messageIndex !== -1) {
        setSelectedOptions(prev => ({
          ...prev,
          [messageIndex]: response
        }));
      }
    }

    // Add user message for text responses (except for "Skip")
    if (type === 'text' && response !== 'Skip') {
      setChatMessages(prev => [...prev, { type: 'user', content: response }]);
    } else if (type === 'multiselect') {
      setChatMessages(prev => [...prev, { type: 'user', content: `Selected: ${response.join(', ')}` }]);
    }

    // Handle different steps
    switch (currentStep) {
      case 'generation-error':
        handleErrorRecovery(response);
        break;

      case 'audience':
        if (response === 'Let AI decide') {
          setCourseData(prev => ({ ...prev, audience: 'Let AI decide' }));
          setChatMessages(prev => [...prev,
          { type: 'assistant', content: `You selected "Let AI decide" for audience. I'll choose the best audience for your course based on your other selections.` },
          { type: 'assistant', content: "How long should your course be? Choose an option or let me figure it out.", options: ['Short (1-2 hours)', 'Medium (3-5 hours)', 'Long (6+ hours)', 'Let AI decide'] }
          ]);
          setCurrentStep('duration');
        } else {
          setCourseData(prev => ({ ...prev, audience: response }));
          setChatMessages(prev => [...prev,
          { type: 'assistant', content: response === 'Skip' ? 'Moving on to course duration.' : `Perfect! Your course is tailored for "${response}".` },
          { type: 'assistant', content: "How long should your course be? Choose an option or let me figure it out.", options: ['Short (1-2 hours)', 'Medium (3-5 hours)', 'Long (6+ hours)', 'Let AI decide'] }
          ]);
          setCurrentStep('duration');
        }
        break;

      case 'duration':
        if (response === 'Let AI decide') {
          setCourseData(prev => ({ ...prev, duration: 'ai-generated' }));
          setChatMessages(prev => [...prev,
          { type: 'assistant', content: `Perfect! I'll choose the best duration for your course based on your other selections.` },
          { type: 'assistant', content: "What content components do you want in your course? You can pick multiple options or let me choose for you.", options: ['Text', 'Video Content', 'Images'], multiSelect: true }
          ]);
          setCurrentStep('components');
          setMultiSelectState({
            isActive: true,
            selectedItems: [],
            step: 'components'
          });
        } else {
          setCourseData(prev => ({ ...prev, duration: response }));
          setChatMessages(prev => [...prev,
          { type: 'assistant', content: response === 'Skip' ? 'Moving on to content components.' : `Got it! The course will be "${response}" long.` },
          { type: 'assistant', content: "What content components do you want in your course? You can pick multiple options or let me choose for you.", options: ['Text', 'Video Content', 'Images'], multiSelect: true }
          ]);
          setCurrentStep('components');
          setMultiSelectState({
            isActive: true,
            selectedItems: [],
            step: 'components'
          });
        }
        break;

      case 'components':
        if (response === 'Let AI decide' || (Array.isArray(response) && response.includes('Let AI decide'))) {
          handleSmartSkip('components');
        } else {
          const selectedComponents = Array.isArray(response) ? response.filter(item => item !== 'Skip') : [response].filter(item => item !== 'Skip');
          setCourseData(prev => ({ ...prev, components: selectedComponents }));
          setChatMessages(prev => [...prev,
          { type: 'assistant', content: response === 'Skip' ? 'Moving on to assessment types.' : `Perfect! I'll include these content components: ${selectedComponents.join(', ')}.` },
          { type: 'assistant', content: "What types of assessments would you like to include? You can pick multiple options or let me choose for you.", options: ['Multiple Choice', 'Checkbox Questions', 'Text Input Questions', 'Dropdown Questions', 'Numerical Problems'], multiSelect: true }
          ]);
          setCurrentStep('assessmentTypes');
          setMultiSelectState({
            isActive: true,
            selectedItems: [],
            step: 'assessmentTypes'
          });
        }
        break;

      case 'assessmentTypes':
        if (response === 'Let AI decide' || (Array.isArray(response) && response.includes('Let AI decide'))) {
          handleSmartSkip('assessmentTypes');
        } else {
          const selectedTypes = Array.isArray(response) ? response.filter(item => item !== 'None' && item !== 'Skip') : [response].filter(item => item !== 'Skip');
          setCourseData(prev => ({
            ...prev,
            assessmentTypes: selectedTypes
          }));
          setChatMessages(prev => [...prev,
          { type: 'assistant', content: response === 'Skip' ? 'Moving on to course generation.' : `Great! I'll include these assessment types: ${selectedTypes.join(', ')}.` }
          ]);
          // Clear multiSelectState when moving to confirmation
          setMultiSelectState({
            isActive: false,
            selectedItems: [],
            step: null
          });
          goToConfirmation();
        }
        break;

      case 'confirmation':
        if (response === 'Yes, generate it!') {
          handleGenerateCourse();
        } else {
          setChatMessages(prev => [...prev,
          { type: 'assistant', content: "No problem—let me know what you'd like to do next." }
          ]);
        }
        break;
    }
  };

  return {
    handleChatResponse,
    handleMultiSelectToggle,
    handleMultiSelectConfirm,
    handleSmartSkip,
    handleErrorRecovery,
    goToConfirmation
  };
};

