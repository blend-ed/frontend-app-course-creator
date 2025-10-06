import { Container, Alert, Spinner } from '@edx/paragon';
import { useState, useEffect } from 'react';
import { getTaskStatus } from '../../api/taskStatus';

const MainPage = () => {
  const [taskStatus, setTaskStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <main>
      <Container className="py-5">
        <h1>Task Status</h1>

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
            <h3>Task Status Data:</h3>
            <pre>{JSON.stringify(taskStatus, null, 2)}</pre>
          </div>
        )}
      </Container>
    </main>
  );
};

export default MainPage;
