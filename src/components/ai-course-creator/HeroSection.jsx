import { useRef } from 'react';
import { Button, Form, Stack } from '@edx/paragon';
import { ArrowForward } from '@edx/paragon/icons';
import PropTypes from 'prop-types';

const HeroSection = ({
  courseTopic,
  setCourseTopic,
  handleTopicSubmit,
  handleKeyDown
}) => {
  const textareaRef = useRef(null);

  const handleTextareaChange = (e) => {
    setCourseTopic(e.target.value);
  };

  return (
    <Stack gap={4} className="text-center py-5">
      <div>
        <h1 className="display-3 mb-3">
          Create an Open edX course in seconds using <span style={{
            background: 'linear-gradient(90deg, #6B46C1 0%, #9333EA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>AI</span>
        </h1>
        <p className="lead text-muted">
          Hi there! I'm here to help you build a course. <br />
          Let's get started—what's the topic or name of the course you'd like to create?
        </p>
      </div>

      <div className="mx-auto" style={{ maxWidth: '700px', width: '100%' }}>
        <div className="position-relative">
          <Form.Control
            ref={textareaRef}
            as="textarea"
            placeholder="Start with a course topic..."
            value={courseTopic}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={4}
            style={{
              resize: 'none',
              borderRadius: '12px',
              paddingRight: '60px',
              fontSize: '1rem'
            }}
          />
          <Button
            variant="primary"
            onClick={handleTopicSubmit}
            disabled={!courseTopic.trim()}
            iconAfter={ArrowForward}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              borderRadius: '8px'
            }}
          >
          </Button>
        </div>
      </div>
    </Stack>
  );
};

HeroSection.propTypes = {
  courseTopic: PropTypes.string.isRequired,
  setCourseTopic: PropTypes.func.isRequired,
  handleTopicSubmit: PropTypes.func.isRequired,
  handleKeyDown: PropTypes.func.isRequired,
};

export default HeroSection;

