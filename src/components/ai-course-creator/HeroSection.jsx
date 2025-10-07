import { Form, Icon, IconButton, Stack, Container, Nav } from '@edx/paragon';
import { ArrowForward } from '@edx/paragon/icons';
import PropTypes from 'prop-types';
import { useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const HeroSection = ({
  courseTopic,
  setCourseTopic,
  handleTopicSubmit,
  handleKeyDown
}) => {
  const textareaRef = useRef(null);
  const location = useLocation();

  const handleTextareaChange = (e) => {
    setCourseTopic(e.target.value);
  };

  return (
    <>
      {/* Navigation Bar */}
      <div style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        <Container>
          <Nav variant="tabs" className="py-2">
            <Nav.Item>
              <Nav.Link
                as={NavLink}
                to="/"
                active={location.pathname === '/'}
              >
                Create Course
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                as={NavLink}
                to="/history"
                active={location.pathname === '/history'}
              >
                History
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                as={NavLink}
                to="/documents"
                active={location.pathname === '/documents'}
              >
                Documents
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Container>
      </div>

      {/* Hero Content */}
      <Container className="py-5">
        <Stack gap={4} className="text-center py-5">
          <div>
            <h1 className="display-3 mb-3">
              Course Creator
            </h1>
            <p className="lead text-muted">
              Create an Open edX course in seconds using AI
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
              <IconButton
                variant="primary"
                onClick={handleTopicSubmit}
                disabled={!courseTopic.trim()}
                iconAs={Icon}
                alt="Arrow Forward"
                src={ArrowForward}
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        </Stack>
      </Container>
    </>
  );
};

HeroSection.propTypes = {
  courseTopic: PropTypes.string.isRequired,
  setCourseTopic: PropTypes.func.isRequired,
  handleTopicSubmit: PropTypes.func.isRequired,
  handleKeyDown: PropTypes.func.isRequired,
};

export default HeroSection;

