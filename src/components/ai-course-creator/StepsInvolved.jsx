import { Stack, Card } from '@edx/paragon';

const StepsInvolved = () => {
  const steps = [
    {
      number: 1,
      text: 'Describe the outline of your course'
    },
    {
      number: 2,
      text: 'Choose components for your course'
    },
    {
      number: 3,
      text: 'AI creates your course'
    },
    {
      number: 4,
      text: 'Download the zip file of the course'
    }
  ];

  return (
    <div className="py-5">
      <Stack direction="horizontal" gap={3} className="justify-content-center flex-wrap">
        {steps.map((step, index) => (
          <div key={step.number} className="d-flex align-items-center">
            <Card className="border-0 shadow-sm text-center" style={{ minWidth: '200px' }}>
              <Card.Body>
                <div className="mb-3">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 100%)',
                      color: 'white',
                      fontSize: '1.25rem'
                    }}
                  >
                    {step.number}
                  </div>
                </div>
                <Card.Text className="mb-0">{step.text}</Card.Text>
              </Card.Body>
            </Card>
            {index < steps.length - 1 && (
              <div className="d-none d-lg-block" style={{
                width: '40px',
                height: '2px',
                background: 'linear-gradient(90deg, #6B46C1 0%, #9333EA 100%)',
                margin: '0 -10px'
              }} />
            )}
          </div>
        ))}
      </Stack>
    </div>
  );
};

export default StepsInvolved;

