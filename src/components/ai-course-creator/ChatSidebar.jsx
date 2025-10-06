import { useState } from 'react';
import { Dropdown, Stack, Icon, IconButton } from '@edx/paragon';
import { Add, Close, Check } from '@edx/paragon/icons';
import PropTypes from 'prop-types';

const ChatSidebar = ({
  courseData,
  multiSelectState,
  setMultiSelectState,
  setCourseData,
  currentStep
}) => {
  const [showComponentsDropdown, setShowComponentsDropdown] = useState(false);
  const [showAssessmentsDropdown, setShowAssessmentsDropdown] = useState(false);

  // Available options for components and assessments
  const availableComponents = ['Text', 'Images', 'Video Content'];
  const availableAssessments = ['Multiple Choice', 'Checkbox Questions', 'Text Input Questions', 'Dropdown Questions', 'Numerical Problems'];

  // Property options mapping
  const propertyOptions = {
    audience: ['Beginners', 'Intermediate', 'Advanced', 'Let AI decide'],
    format: ['Self-paced', 'Instructor-led', 'Blended', 'Cohort-based'],
    duration: ['Short (1-2 hours)', 'Medium (3-5 hours)', 'Long (6+ hours)', 'Let AI decide'],
    difficulty: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  };

  // Handle property change
  const handlePropertyChange = (propertyType, value) => {
    let processedValue = value;
    if (propertyType === 'duration' && value === 'Let AI decide') {
      processedValue = 'ai-generated';
    }
    setCourseData(prev => ({
      ...prev,
      [propertyType]: processedValue
    }));
  };

  // Get selected options by category
  const getSelectedByCategory = () => {
    const categories = {
      Properties: [],
      Assessments: [],
      Components: []
    };

    if (courseData.audience) categories.Properties.push({ type: 'audience', value: courseData.audience });
    if (courseData.format) categories.Properties.push({ type: 'format', value: courseData.format });
    if (courseData.duration) {
      const displayValue = courseData.duration === 'ai-generated' ? 'Let AI decide' : courseData.duration;
      categories.Properties.push({ type: 'duration', value: displayValue });
    }
    if (courseData.difficulty) categories.Properties.push({ type: 'difficulty', value: courseData.difficulty });

    if (courseData.components && courseData.components.length > 0) {
      courseData.components.forEach(component => {
        if (availableComponents.includes(component)) {
          categories.Components.push(component);
        }
      });
    }

    if (courseData.assessmentTypes && courseData.assessmentTypes.length > 0) {
      courseData.assessmentTypes.forEach(assessment => {
        if (availableAssessments.includes(assessment)) {
          categories.Assessments.push(assessment);
        }
      });
    }

    if (multiSelectState.isActive && multiSelectState.selectedItems.length > 0) {
      multiSelectState.selectedItems.forEach(item => {
        if (['Multiple Choice', 'Checkbox Questions', 'Text Input Questions', 'Dropdown Questions', 'Numerical Problems'].includes(item)) {
          if (!categories.Assessments.includes(item)) {
            categories.Assessments.push(item);
          }
        } else if (['Text', 'Video Content', 'Images'].includes(item)) {
          if (!categories.Components.includes(item)) {
            categories.Components.push(item);
          }
        }
      });
    }

    return categories;
  };

  const selectedCategories = getSelectedByCategory();

  const hasReachedComponentsStep = () => {
    const stepsAfterComponents = ['components', 'assessmentTypes', 'confirmation'];
    return stepsAfterComponents.includes(currentStep) ||
      (courseData.components && courseData.components.length > 0) ||
      selectedCategories.Components.length > 0;
  };

  const hasReachedAssessmentsStep = () => {
    const stepsAfterAssessments = ['assessmentTypes', 'confirmation'];
    return stepsAfterAssessments.includes(currentStep) ||
      (courseData.assessmentTypes && courseData.assessmentTypes.length > 0) ||
      selectedCategories.Assessments.length > 0;
  };

  const isComponentSelected = (component) => {
    return (courseData.components && courseData.components.includes(component)) ||
      (multiSelectState.selectedItems && multiSelectState.selectedItems.includes(component));
  };

  const isAssessmentSelected = (assessment) => {
    return (courseData.assessmentTypes && courseData.assessmentTypes.includes(assessment)) ||
      (multiSelectState.selectedItems && multiSelectState.selectedItems.includes(assessment));
  };

  const handleToggleComponent = (component) => {
    if (isComponentSelected(component)) {
      if (courseData.components && courseData.components.includes(component)) {
        setCourseData(prev => ({
          ...prev,
          components: prev.components.filter(c => c !== component)
        }));
      } else if (multiSelectState.selectedItems && multiSelectState.selectedItems.includes(component)) {
        setMultiSelectState(prev => ({
          ...prev,
          selectedItems: prev.selectedItems.filter(c => c !== component)
        }));
      }
    } else {
      setCourseData(prev => ({
        ...prev,
        components: [...(prev.components || []), component]
      }));
    }
  };

  const handleToggleAssessment = (assessment) => {
    if (isAssessmentSelected(assessment)) {
      if (courseData.assessmentTypes && courseData.assessmentTypes.includes(assessment)) {
        setCourseData(prev => ({
          ...prev,
          assessmentTypes: prev.assessmentTypes.filter(a => a !== assessment)
        }));
      } else if (multiSelectState.selectedItems && multiSelectState.selectedItems.includes(assessment)) {
        setMultiSelectState(prev => ({
          ...prev,
          selectedItems: prev.selectedItems.filter(a => a !== assessment)
        }));
      }
    } else {
      setCourseData(prev => ({
        ...prev,
        assessmentTypes: [...(prev.assessmentTypes || []), assessment]
      }));
    }
  };

  return (
    <div className="border-start p-3" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Stack gap={3}>
        {/* Properties Section */}
        {selectedCategories.Properties.length > 0 && (
          <div>
            <h6 className="mb-2 fw-bold">Properties</h6>
            <Stack gap={2}>
              {selectedCategories.Properties.map((property, index) => (
                <Dropdown key={index}>
                  <Dropdown.Toggle variant="outline-secondary" size="sm" className="w-100 text-start">
                    {property.value}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {propertyOptions[property.type]?.map((option, optionIndex) => {
                      let isActive = property.value === option;
                      if (property.type === 'duration' && courseData.duration === 'ai-generated' && option === 'Let AI decide') {
                        isActive = true;
                      }
                      return (
                        <Dropdown.Item
                          key={optionIndex}
                          active={isActive}
                          onClick={() => handlePropertyChange(property.type, option)}
                        >
                          {option}
                        </Dropdown.Item>
                      );
                    })}
                  </Dropdown.Menu>
                </Dropdown>
              ))}
            </Stack>
          </div>
        )}

        {/* Components Section */}
        {hasReachedComponentsStep() && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0 fw-bold">Components</h6>
              <Dropdown show={showComponentsDropdown} onToggle={setShowComponentsDropdown}>
                <Dropdown.Toggle as={IconButton} src={Add} iconAs={Icon} alt="Add component" size="sm" variant="light" />
                <Dropdown.Menu>
                  {availableComponents.map((component) => (
                    <Dropdown.Item
                      key={component}
                      onClick={() => handleToggleComponent(component)}
                      className="d-flex align-items-center justify-content-between"
                    >
                      <span>{component}</span>
                      {isComponentSelected(component) && <Icon src={Check} className="text-success" />}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <Stack gap={2}>
              {selectedCategories.Components.map((item, index) => (
                <div key={index} className="d-flex align-items-center justify-content-between p-2 bg-white rounded border">
                  <span className="small">{item}</span>
                  <IconButton
                    src={Close}
                    iconAs={Icon}
                    alt="Remove"
                    onClick={() => handleToggleComponent(item)}
                    size="sm"
                    variant="light"
                  />
                </div>
              ))}
            </Stack>
          </div>
        )}

        {/* Assessments Section */}
        {hasReachedAssessmentsStep() && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0 fw-bold">Assessments</h6>
              <Dropdown show={showAssessmentsDropdown} onToggle={setShowAssessmentsDropdown}>
                <Dropdown.Toggle as={IconButton} src={Add} iconAs={Icon} alt="Add assessment" size="sm" variant="light" />
                <Dropdown.Menu>
                  {availableAssessments.map((assessment) => (
                    <Dropdown.Item
                      key={assessment}
                      onClick={() => handleToggleAssessment(assessment)}
                      className="d-flex align-items-center justify-content-between"
                    >
                      <span className="small">{assessment}</span>
                      {isAssessmentSelected(assessment) && <Icon src={Check} className="text-success" />}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <Stack gap={2}>
              {selectedCategories.Assessments.map((item, index) => (
                <div key={index} className="d-flex align-items-center justify-content-between p-2 bg-white rounded border">
                  <span className="small">{item}</span>
                  <IconButton
                    src={Close}
                    iconAs={Icon}
                    alt="Remove"
                    onClick={() => handleToggleAssessment(item)}
                    size="sm"
                    variant="light"
                  />
                </div>
              ))}
            </Stack>
          </div>
        )}
      </Stack>
    </div>
  );
};

ChatSidebar.propTypes = {
  courseData: PropTypes.object.isRequired,
  multiSelectState: PropTypes.object.isRequired,
  setMultiSelectState: PropTypes.func.isRequired,
  setCourseData: PropTypes.func.isRequired,
  currentStep: PropTypes.string,
};

export default ChatSidebar;

