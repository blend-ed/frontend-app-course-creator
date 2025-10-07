import { getConfig } from '@edx/frontend-platform';
import { Button, ModalDialog, Stack } from '@edx/paragon';
import { History, OpenInNew } from '@edx/paragon/icons';
import PropTypes from 'prop-types';

const GenerationProgressModal = ({ show, handleCancel }) => {

  const config = getConfig();
  const COURSE_AUTHORING_MICROFRONTEND_URL = config.COURSE_AUTHORING_MICROFRONTEND_URL;

  return (
    <ModalDialog
      title="Generating Course"
      isOpen={show}
      onClose={handleCancel}
      hasCloseButton
      size="lg"
    >
      <ModalDialog.Header>
        <ModalDialog.Title>Generating Your Course</ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        <Stack gap={2}>
          <div>
            <h5 className="mb-2">The generated course will be added to your course library.</h5>
            <p className="text-muted">Generating your course can take up to 6 minutes to complete</p>
          </div>
          <Stack gap={2}>
            <Button
              variant="primary"
              href={'history'}
              iconBefore={History}
              className="w-100"
            >
              Show All Course Creation Status
            </Button>
            <Button
              variant="outline-primary"
              href={COURSE_AUTHORING_MICROFRONTEND_URL + '/home'}
              target="_blank"
              iconBefore={OpenInNew}
              className="w-100"
            >
              Go to Course Authoring Studio
            </Button>
          </Stack>
        </Stack>
      </ModalDialog.Body>
    </ModalDialog>
  );
};

GenerationProgressModal.propTypes = {
  show: PropTypes.bool.isRequired,
  setShowGenerationModal: PropTypes.func.isRequired,
  taskId: PropTypes.string,
  handleCancel: PropTypes.func.isRequired,
};

export default GenerationProgressModal;

