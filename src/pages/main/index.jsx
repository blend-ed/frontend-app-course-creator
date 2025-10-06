import { Container, Alert, Spinner, Button, Form, Card } from '@edx/paragon';
import { useState, useEffect } from 'react';
import { getTaskStatus } from '../../api/taskStatus';
import { createCourse } from '../../api/courseCreator';

const MainPage = () => {
  const [taskStatus, setTaskStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Course Creator states
  const [courseForm, setCourseForm] = useState({
    action: 'create_structure',
    topic: '',
    instructions: '',
    course_size: 'medium',
    audience: '',
    target_language: 'en',
    available_components: ['html', 'video', 'problem_multiple_choice']
  });
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseResponse, setCourseResponse] = useState(null);
  const [courseError, setCourseError] = useState(null);

  useEffect(() => {
    const fetchTaskStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getTaskStatus('f1e94317-bac5-41d1-b5f9-ffe24d6be773');
        setTaskStatus(response.data);
        console.log('Task status response:', response.data);
      } catch (err) {
        console.error('Error fetching task status:', err);
        setError(err.message || 'Failed to fetch task status');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskStatus();
  }, []);

  const handleCourseFormChange = (field, value) => {
    setCourseForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComponentToggle = (component) => {
    setCourseForm(prev => ({
      ...prev,
      available_components: prev.available_components.includes(component)
        ? prev.available_components.filter(c => c !== component)
        : [...prev.available_components, component]
    }));
  };

  const handleCreateCourse = async () => {
    try {
      setCourseLoading(true);
      setCourseError(null);
      setCourseResponse(null);

      const response = await createCourse(courseForm);
      setCourseResponse(response.data);
      console.log('Course creation response:', response.data);
    } catch (err) {
      console.error('Error creating course:', err);
      setCourseError(err.message || 'Failed to create course');
    } finally {
      setCourseLoading(false);
    }
  };

  return (
    <main>
      <Container className="py-5">
        <h1>Course Creator API Examples</h1>

        <div className="row">
          {/* Task Status Section */}
          <div className="col-md-6">
            <Card className="mb-4">
              <Card.Header>
                <h3>Task Status API</h3>
              </Card.Header>
              <Card.Body>
                {loading && (
                  <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Loading task status...</span>
                  </div>
                )}

                {error && (
                  <Alert variant="danger">
                    <strong>Error:</strong> {error}
                    <br />
                    <small>This might be due to network connectivity issues, CORS problems, or incorrect configuration.</small>
                  </Alert>
                )}

                {taskStatus && !loading && !error && (
                  <div>
                    <h5>Task Status Data:</h5>
                    <pre className="small">{JSON.stringify(taskStatus, null, 2)}</pre>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Course Creator Section */}
          <div className="col-md-6">
            <Card className="mb-4">
              <Card.Header>
                <h3>Course Creator API</h3>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Action</Form.Label>
                    <Form.Control
                      as="select"
                      value={courseForm.action}
                      onChange={(e) => handleCourseFormChange('action', e.target.value)}
                    >
                      <option value="create_structure">Create Structure</option>
                      <option value="update_structure">Update Structure</option>
                      <option value="create_content">Create Content</option>
                    </Form.Control>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Topic *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Introduction to React"
                      value={courseForm.topic}
                      onChange={(e) => handleCourseFormChange('topic', e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Instructions</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Additional instructions for course generation..."
                      value={courseForm.instructions}
                      onChange={(e) => handleCourseFormChange('instructions', e.target.value)}
                    />
                  </Form.Group>

                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Course Size</Form.Label>
                        <Form.Control
                          as="select"
                          value={courseForm.course_size}
                          onChange={(e) => handleCourseFormChange('course_size', e.target.value)}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                          <option value="ai-generated">AI Generated</option>
                        </Form.Control>
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Target Language</Form.Label>
                        <Form.Control
                          as="select"
                          value={courseForm.target_language}
                          onChange={(e) => handleCourseFormChange('target_language', e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="hi">Hindi</option>
                          <option value="ml">Malayalam</option>
                          <option value="ar">Arabic</option>
                          <option value="he">Hebrew</option>
                          <option value="fa">Persian</option>
                          <option value="ur">Urdu</option>
                        </Form.Control>
                      </Form.Group>
                    </div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Audience</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., beginners, professionals"
                      value={courseForm.audience}
                      onChange={(e) => handleCourseFormChange('audience', e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Available Components</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {['html', 'video', 'problem_multiple_choice', 'problem_checkboxes',
                        'problem_dropdown', 'problem_numeric', 'problem_text', 'image'].map(component => (
                          <Button
                            key={component}
                            variant={courseForm.available_components.includes(component) ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => handleComponentToggle(component)}
                          >
                            {component}
                          </Button>
                        ))}
                    </div>
                  </Form.Group>

                  <Button
                    variant="primary"
                    onClick={handleCreateCourse}
                    disabled={courseLoading || !courseForm.topic}
                  >
                    {courseLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Creating Course...
                      </>
                    ) : (
                      'Create Course'
                    )}
                  </Button>
                </Form>

                {courseError && (
                  <Alert variant="danger" className="mt-3">
                    <strong>Error:</strong> {courseError}
                  </Alert>
                )}

                {courseResponse && !courseLoading && !courseError && (
                  <div className="mt-3">
                    <h5>Course Creation Response:</h5>
                    <pre className="small">{JSON.stringify(courseResponse, null, 2)}</pre>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
};

export default MainPage;
