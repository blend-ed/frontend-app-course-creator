import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  DataTable,
  Button,
  Badge,
  Pagination,
  Form,
  SearchField,
  Stack,
  Spinner,
  Alert,
  ActionRow,
  Card,
  Icon,
  IconButton,
} from '@openedx/paragon';
import { InfoOutline, Refresh } from '@openedx/paragon/icons';
import { listAICourses, getAICourse } from '../api/aiCourses';
import { getConfig } from '@edx/frontend-platform';

const History = () => {
  const apiType = getConfig().BLENDX_AICC_API_TYPE;
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [courseSizeFilter, setCourseSizeFilter] = useState('');
  const [ordering, setOrdering] = useState('-created');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        ordering,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (actionFilter) params.action = actionFilter;
      if (courseSizeFilter) params.course_size = courseSizeFilter;

      const response = await listAICourses(params);
      const data = response.data;

      setCourses(data.courses || []);
      setTotalCount(data.count || 0);
      setTotalPages(data.total_pages || 1);
      setStatusCounts(data.status_counts || {});
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, actionFilter, courseSizeFilter, ordering]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleActionFilterChange = (e) => {
    setActionFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleCourseSizeFilterChange = (e) => {
    setCourseSizeFilter(e.target.value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      success: { variant: 'success', label: 'Success' },
      processing: { variant: 'info', label: 'Processing' },
      pending: { variant: 'warning', label: 'Pending' },
      failed: { variant: 'danger', label: 'Failed' },
    };

    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (duration) => {
    if (!duration || duration === 'N/A') return 'N/A';
    return duration;
  };

  const allColumns = [
    {
      Header: 'Topic',
      accessor: 'topic',
      Cell: ({ row }) => (
        <div style={{ maxWidth: '300px' }}>
          <div className="font-weight-bold text-truncate" title={row.original.topic}>
            {row.original.topic}
          </div>
          {row.original.course_key && (
            <div className="small text-muted text-truncate" title={row.original.course_key}>
              {row.original.course_key}
            </div>
          )}
        </div>
      ),
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => getStatusBadge(value),
    },
    {
      Header: 'Action',
      accessor: 'action',
      Cell: ({ value }) => {
        const actionLabels = {
          create_structure: 'Create Structure',
          create_content: 'Create Content',
          update_structure: 'Update Structure',
        };
        return <span className="small">{actionLabels[value] || value}</span>;
      },
    },
    {
      Header: 'Size',
      accessor: 'course_size',
      Cell: ({ value }) => {
        const sizeLabels = {
          small: 'Small',
          medium: 'Medium',
          large: 'Large',
          'ai-generated': 'AI Generated',
        };
        return <span className="small">{sizeLabels[value] || value || 'N/A'}</span>;
      },
    },
    {
      Header: 'Duration',
      accessor: 'duration',
      Cell: ({ value }) => <span className="small">{formatDuration(value)}</span>,
    },
    {
      Header: 'Attachments',
      accessor: 'attachment_count',
      Cell: ({ value }) => <span className="small text-center d-block">{value || 0}</span>,
    },
    {
      Header: 'Created',
      accessor: 'created',
      Cell: ({ value }) => <span className="small">{formatDate(value)}</span>,
    },
    {
      Header: 'Actions',
      accessor: 'id',
      Cell: ({ value }) => (
        <IconButton
          src={InfoOutline}
          iconAs={Icon}
          alt="View Details"
          size="sm"
          variant="primary"
          onClick={() => handleViewDetails(value)}
        />
      ),
    },
  ];

  // Filter columns based on API type
  const columns = apiType === 'blendxcoursecreator'
    ? allColumns.filter(col => col.accessor !== 'action' && col.accessor !== 'duration')
    : allColumns;

  const handleViewDetails = async (courseId) => {
    try {
      const response = await getAICourse(courseId);
      console.log('Course details:', response.data);
      // TODO: Implement detail view modal or navigation
      alert(`Course details for ID ${courseId}:\n${JSON.stringify(response.data.course, null, 2)}`);
    } catch (err) {
      console.error('Error fetching course details:', err);
      alert('Failed to load course details. Please try again.');
    }
  };

  return (
    <Container className="p-4">
      <Stack gap={3}>
        {/* Header */}
        <ActionRow>
          <ActionRow.Spacer />
          <h2 className="mb-0">AI Course History</h2>
          <ActionRow.Spacer />
          <IconButton
            src={Refresh}
            iconAs={Icon}
            alt="Refresh"
            onClick={fetchCourses}
            disabled={loading}
          />
        </ActionRow>

        {/* Status Summary */}
        {Object.keys(statusCounts).length > 0 && (
          <Card>
            <Card.Section>
              <div className="d-flex gap-4 justify-content-around">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <div className="h4 mb-0">{count}</div>
                    <div className="small text-muted text-capitalize">{status}</div>
                  </div>
                ))}
                <div className="text-center">
                  <div className="h4 mb-0">{totalCount}</div>
                  <div className="small text-muted">Total</div>
                </div>
              </div>
            </Card.Section>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <Card.Section>
            <Stack gap={3}>
              <SearchField
                onSubmit={handleSearch}
                onChange={handleSearch}
                value={searchTerm}
                placeholder="Search by topic, instructions, or audience..."
              />

              <div className="d-flex gap-3 flex-wrap">
                <Form.Group className="flex-grow-1 mb-0">
                  <Form.Control
                    as="select"
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </Form.Control>
                </Form.Group>

                <Form.Group className="flex-grow-1 mb-0">
                  <Form.Control
                    as="select"
                    value={actionFilter}
                    onChange={handleActionFilterChange}
                  >
                    <option value="">All Actions</option>
                    <option value="create_structure">Create Structure</option>
                    <option value="create_content">Create Content</option>
                    <option value="update_structure">Update Structure</option>
                  </Form.Control>
                </Form.Group>

                <Form.Group className="flex-grow-1 mb-0">
                  <Form.Control
                    as="select"
                    value={courseSizeFilter}
                    onChange={handleCourseSizeFilterChange}
                  >
                    <option value="">All Sizes</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="ai-generated">AI Generated</option>
                  </Form.Control>
                </Form.Group>

                <Form.Group className="flex-grow-1 mb-0">
                  <Form.Control
                    as="select"
                    value={ordering}
                    onChange={(e) => {
                      setOrdering(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="-created">Newest First</option>
                    <option value="created">Oldest First</option>
                    <option value="topic">Topic A-Z</option>
                    <option value="-topic">Topic Z-A</option>
                    <option value="status">Status A-Z</option>
                    <option value="-status">Status Z-A</option>
                  </Form.Control>
                </Form.Group>
              </div>
            </Stack>
          </Card.Section>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Data Table */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-3">Loading courses...</div>
          </div>
        ) : courses.length === 0 ? (
          <Alert variant="info">
            No courses found. {searchTerm || statusFilter || actionFilter || courseSizeFilter ? 'Try adjusting your filters.' : 'Create your first course to get started!'}
          </Alert>
        ) : (
          <>
            <DataTable
              data={courses}
              columns={columns}
              itemCount={totalCount}
              defaultColumnValues={{ Filter: () => null }}
            >
              <DataTable.TableControlBar />
              <DataTable.Table />
            </DataTable>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-3">
                <Pagination
                  paginationLabel="Course pagination"
                  pageCount={totalPages}
                  currentPage={currentPage}
                  onPageSelect={setCurrentPage}
                  buttonLabels={{
                    previous: 'Previous',
                    next: 'Next',
                    page: 'Page',
                    currentPage: 'Current Page',
                    pageOfCount: 'of',
                  }}
                />
                <Form.Group className="mb-0">
                  <Form.Control
                    as="select"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{ width: 'auto' }}
                  >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </Form.Control>
                </Form.Group>
              </div>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
};

export default History;

