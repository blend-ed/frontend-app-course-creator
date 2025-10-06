import { Button, ModalDialog, ProgressBar, Stack, Spinner, Alert } from '@edx/paragon';
import { Download, OpenInNew } from '@edx/paragon/icons';
import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

const GenerationProgressModal = ({ show, setShowGenerationModal, topic, email, handleCancel: handleCancelParent }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [downloadLink, setDownloadLink] = useState('');
  const [previewPath, setPreviewPath] = useState('');
  const [courseFailed, setCourseFailed] = useState(false);
  const metadataIntervalRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const steps = [
    { title: "Outlining course structure...", },
    { title: "Generating content...", },
    { title: "Creating components...", }
  ];

  const handleDownload = (e) => {
    e.preventDefault();
    if (!downloadLink) return;
    const urlParts = downloadLink.split('/');
    const filename = urlParts[urlParts.length - 1];
    const link = document.createElement('a');
    link.href = downloadLink;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const checkMetadata = async () => {
    try {
      const config = getConfig();
      const baseUrl = config.STUDIO_BASE_URL;
      const response = await getAuthenticatedHttpClient().get(
        `${baseUrl}/blendxcoursecreator_enterprise/api/course-creator/metadata?topic=${encodeURIComponent(topic)}&email=${encodeURIComponent(email)}`
      );
      const data = response.data;

      if (data.courses_summary && data.courses_summary.length > 0) {
        const courseData = data.courses_summary[0];

        if (courseData.failed) {
          setCourseFailed(true);
          setProgress(100);
          setCurrentStep(steps.length - 1);
          if (metadataIntervalRef.current) {
            clearInterval(metadataIntervalRef.current);
            metadataIntervalRef.current = null;
          }
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return;
        }

        if (courseData.file_url) {
          setDownloadLink(courseData.file_url);
          setPreviewPath(courseData.file_url);
          setProgress(100);
          setCurrentStep(steps.length - 1);
          if (metadataIntervalRef.current) {
            clearInterval(metadataIntervalRef.current);
            metadataIntervalRef.current = null;
          }
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        }
      }
    } catch (error) {
      console.error('Error checking metadata:', error);
    }
  };

  useEffect(() => {
    if (show) {
      setProgress(0);
      setCurrentStep(0);
      setCourseFailed(false);
      setDownloadLink('');

      const totalDuration = 6 * 60 * 1000; // 6 minutes
      const stepDurations = [
        15 * 1000,            // Step 1: 15 seconds
        2 * 60 * 1000,        // Step 2: 2 minutes
        3 * 60 * 1000 + 45 * 1000 // Step 3: Remaining time
      ];
      const updateInterval = 1000;

      let startTime = Date.now();
      let elapsedTime = 0;

      metadataIntervalRef.current = setInterval(checkMetadata, 30 * 1000);
      checkMetadata();

      progressIntervalRef.current = setInterval(() => {
        if (downloadLink || courseFailed) {
          setProgress(100);
          setCurrentStep(steps.length - 1);
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
          return;
        }

        elapsedTime = Date.now() - startTime;
        let timeSum = 0;
        let newStep = 0;

        for (let i = 0; i < stepDurations.length; i++) {
          timeSum += stepDurations[i];
          if (elapsedTime < timeSum) {
            newStep = i;
            break;
          }
          if (i === stepDurations.length - 1) {
            newStep = i;
          }
        }

        const prevStepsTime = newStep > 0 ?
          stepDurations.slice(0, newStep).reduce((sum, duration) => sum + duration, 0) : 0;
        const stepElapsedTime = elapsedTime - prevStepsTime;
        const stepProgress = Math.min(stepElapsedTime / stepDurations[newStep], 1);

        const prevStepsProgress = newStep > 0 ?
          stepDurations.slice(0, newStep).reduce((sum, duration) => sum + duration, 0) / totalDuration * 100 : 0;
        const currentStepOverallProgress = stepProgress * (stepDurations[newStep] / totalDuration) * 100;
        const newProgress = Math.min(prevStepsProgress + currentStepOverallProgress, 100);

        setCurrentStep(newStep);
        setProgress(newProgress);

        if (elapsedTime >= totalDuration) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }, updateInterval);

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (metadataIntervalRef.current) {
          clearInterval(metadataIntervalRef.current);
          metadataIntervalRef.current = null;
        }
      };
    }
  }, [show, topic, email, downloadLink, courseFailed]);

  const handleCancel = () => {
    setProgress(0);
    setCurrentStep(0);
    setDownloadLink('');
    setCourseFailed(false);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (metadataIntervalRef.current) {
      clearInterval(metadataIntervalRef.current);
      metadataIntervalRef.current = null;
    }
    handleCancelParent();
  };

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
        <Stack gap={4}>
          <div className="text-center">
            <h5 className="mb-2">The generated course will be sent to your email as a downloadable file.</h5>
            <p className="text-muted">Generating your course can take up to 6 minutes to complete</p>
          </div>

          <ProgressBar now={progress} variant="primary" style={{ height: '12px' }} />

          <Stack gap={3}>
            {steps.map((step, index) => (
              <div
                key={index}
                className={`d-flex align-items-center gap-3 p-3 rounded ${index <= currentStep ? 'bg-light' : 'bg-white'
                  } ${index === currentStep ? 'border border-primary' : 'border'}`}
              >
                <div className={`${index <= currentStep ? 'text-primary' : 'text-muted'}`}>
                  {index < currentStep ? '✓' : index === currentStep ? <Spinner animation="border" size="sm" /> : '○'}
                </div>
                <span className={index <= currentStep ? 'fw-bold' : 'text-muted'}>
                  {step.title}
                </span>
              </div>
            ))}
          </Stack>

          {courseFailed ? (
            <Alert variant="danger">
              Course generation failed. Please try again with different parameters.
            </Alert>
          ) : (
            <Stack gap={2}>
              <Button
                variant="primary"
                onClick={handleDownload}
                disabled={!downloadLink}
                iconBefore={Download}
                className="w-100"
              >
                {downloadLink ? 'Download Course' : (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating...
                  </>
                )}
              </Button>
              <Button
                variant="outline-primary"
                href={previewPath}
                target="_blank"
                disabled={!previewPath}
                iconBefore={OpenInNew}
                className="w-100"
              >
                Preview Course
              </Button>
            </Stack>
          )}
        </Stack>
      </ModalDialog.Body>
    </ModalDialog>
  );
};

GenerationProgressModal.propTypes = {
  show: PropTypes.bool.isRequired,
  setShowGenerationModal: PropTypes.func.isRequired,
  topic: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  handleCancel: PropTypes.func.isRequired,
};

export default GenerationProgressModal;

