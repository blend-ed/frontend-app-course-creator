import { Button, Form, ModalDialog, Stack, Spinner } from '@edx/paragon';
import PropTypes from 'prop-types';

const ApprovalModal = ({ show, onHide, onSubmit, formData, setFormData, isLoading }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <ModalDialog
      title="Your Course is Almost Ready!"
      isOpen={show}
      onClose={isLoading ? undefined : onHide}
      hasCloseButton={!isLoading}
      size="md"
    >
      <ModalDialog.Header>
        <ModalDialog.Title>Your Course is Almost Ready!</ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        <p className="mb-4">Enter details to preview & get your course by email too.</p>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Work Mail</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your work mail"
              name="workEmail"
              value={formData.workEmail}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </Form.Group>

          <Stack direction="horizontal" gap={2} className="justify-content-end">
            <Button variant="outline-secondary" onClick={onHide} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </Stack>
        </Form>
      </ModalDialog.Body>
    </ModalDialog>
  );
};

ApprovalModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default ApprovalModal;

