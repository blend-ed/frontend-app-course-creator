import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  DataTable,
  Button,
  Badge,
  Form,
  SearchField,
  Stack,
  Spinner,
  Alert,
  ActionRow,
  Card,
  Icon,
  IconButton,
  ModalDialog,
} from '@openedx/paragon';
import { Delete, Edit, Refresh, FilePresent, CheckCircle, Cancel } from '@openedx/paragon/icons';
import { listAttachments, deleteAttachment, updateAttachment } from '../api/attachments';

const Documents = () => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState(null);
  const [editDescription, setEditDescription] = useState('');

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState(null);

  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (fileTypeFilter) params.file_type = fileTypeFilter;

      const response = await listAttachments(params);
      const data = response.data;

      let attachmentsList = data.attachments || [];

      // Client-side search filtering if searchTerm exists
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        attachmentsList = attachmentsList.filter(
          att =>
            att.filename?.toLowerCase().includes(lowerSearch) ||
            att.description?.toLowerCase().includes(lowerSearch)
        );
      }

      setAttachments(attachmentsList);
    } catch (err) {
      console.error('Error fetching attachments:', err);
      setError('Failed to load attachments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fileTypeFilter, searchTerm]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleFileTypeFilterChange = (e) => {
    setFileTypeFilter(e.target.value);
  };

  const handleEditClick = (attachment) => {
    setEditingAttachment(attachment);
    setEditDescription(attachment.description || '');
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingAttachment) return;

    try {
      await updateAttachment(editingAttachment.id, editDescription);
      setSuccessMessage('Attachment description updated successfully!');
      setEditModalOpen(false);
      setEditingAttachment(null);
      setEditDescription('');
      fetchAttachments();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating attachment:', err);
      setError('Failed to update attachment. Please try again.');
    }
  };

  const handleDeleteClick = (attachment) => {
    setDeletingAttachment(attachment);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAttachment) return;

    try {
      await deleteAttachment(deletingAttachment.id);
      setSuccessMessage('Attachment deleted successfully!');
      setDeleteModalOpen(false);
      setDeletingAttachment(null);
      fetchAttachments();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting attachment:', err);
      setError('Failed to delete attachment. Please try again.');
    }
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

  const formatFileSize = (sizeMB) => {
    if (!sizeMB && sizeMB !== 0) return 'N/A';
    if (sizeMB < 1) {
      return `${(sizeMB * 1024).toFixed(2)} KB`;
    }
    return `${sizeMB.toFixed(2)} MB`;
  };

  const getFileTypeIcon = (fileType, extension) => {
    // Return appropriate icon based on file type
    return <Icon src={FilePresent} className="mr-2" />;
  };

  const columns = [
    {
      Header: 'File',
      accessor: 'filename',
      Cell: ({ row }) => (
        <div className="d-flex align-items-center gap-2" style={{ maxWidth: '300px' }}>
          {getFileTypeIcon(row.original.file_type, row.original.file_extension)}
          <div className="flex-grow-1 overflow-hidden">
            <div className="font-weight-bold text-truncate" title={row.original.filename}>
              {row.original.filename}
            </div>
            <div className="small text-muted">
              {row.original.file_extension?.toUpperCase() || 'N/A'}
            </div>
          </div>
          {row.original.is_supported_format && (
            <Icon src={CheckCircle} className="ml-2 text-success" style={{ fontSize: '1rem' }} />
          )}
        </div>
      ),
    },
    {
      Header: 'Description',
      accessor: 'description',
      Cell: ({ value }) => (
        <div style={{ maxWidth: '250px' }} className="text-truncate" title={value || 'No description'}>
          {value || <span className="text-muted font-italic">No description</span>}
        </div>
      ),
    },
    {
      Header: 'Type',
      accessor: 'file_type',
      Cell: ({ value }) => (
        <span className="small text-muted">{value || 'N/A'}</span>
      ),
    },
    {
      Header: 'Size',
      accessor: 'file_size_mb',
      Cell: ({ value }) => <span className="small">{formatFileSize(value)}</span>,
    },
    {
      Header: 'Created',
      accessor: 'created',
      Cell: ({ value }) => <span className="small">{formatDate(value)}</span>,
    },
    {
      Header: 'Actions',
      accessor: 'id',
      Cell: ({ row }) => (
        <div className="d-flex gap-2">
          <IconButton
            src={Edit}
            iconAs={Icon}
            alt="Edit Description"
            size="sm"
            variant="primary"
            onClick={() => handleEditClick(row.original)}
          />
          <IconButton
            src={Delete}
            iconAs={Icon}
            alt="Delete"
            size="sm"
            variant="danger"
            onClick={() => handleDeleteClick(row.original)}
          />
        </div>
      ),
    },
  ];

  return (
    <Container className="p-4">
      <Stack gap={3}>
        {/* Header */}
        <ActionRow>
          <ActionRow.Spacer />
          <h2 className="mb-0">My Documents</h2>
          <ActionRow.Spacer />
          <IconButton
            src={Refresh}
            iconAs={Icon}
            alt="Refresh"
            onClick={fetchAttachments}
            disabled={loading}
          />
        </ActionRow>

        {/* Summary Card */}
        <Card>
          <Card.Section>
            <div className="d-flex gap-4 justify-content-around">
              <div className="text-center">
                <div className="h4 mb-0">{attachments.length}</div>
                <div className="small text-muted">Total Documents</div>
              </div>
              <div className="text-center">
                <div className="h4 mb-0">
                  {attachments.filter(a => a.is_supported_format).length}
                </div>
                <div className="small text-muted">Supported Formats</div>
              </div>
              <div className="text-center">
                <div className="h4 mb-0">
                  {attachments.reduce((sum, a) => sum + (a.file_size_mb || 0), 0).toFixed(2)} MB
                </div>
                <div className="small text-muted">Total Size</div>
              </div>
            </div>
          </Card.Section>
        </Card>

        {/* Filters */}
        <Card>
          <Card.Section>
            <Stack gap={3}>
              <SearchField
                onSubmit={handleSearch}
                onChange={handleSearch}
                value={searchTerm}
                placeholder="Search by filename or description..."
              />

              <div className="d-flex gap-3 flex-wrap">
                <Form.Group className="flex-grow-1">
                  <Form.Control
                    as="select"
                    value={fileTypeFilter}
                    onChange={handleFileTypeFilterChange}
                  >
                    <option value="">All File Types</option>
                    <option value="application/pdf">PDF</option>
                    <option value="application/vnd.ms-powerpoint">PowerPoint (PPT)</option>
                    <option value="application/vnd.openxmlformats-officedocument.presentationml.presentation">PowerPoint (PPTX)</option>
                    <option value="application/msword">Word (DOC)</option>
                    <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word (DOCX)</option>
                    <option value="text/plain">Text</option>
                  </Form.Control>
                </Form.Group>
              </div>
            </Stack>
          </Card.Section>
        </Card>

        {/* Success Alert */}
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

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
            <div className="mt-3">Loading documents...</div>
          </div>
        ) : attachments.length === 0 ? (
          <Alert variant="info">
            No documents found. {searchTerm || fileTypeFilter ? 'Try adjusting your filters.' : 'Upload your first document to get started!'}
          </Alert>
        ) : (
          <DataTable
            data={attachments}
            columns={columns}
            itemCount={attachments.length}
            defaultColumnValues={{ Filter: () => null }}
          >
            <DataTable.TableControlBar />
            <DataTable.Table />
          </DataTable>
        )}
      </Stack>

      {/* Edit Description Modal */}
      <ModalDialog
        title="Edit Description"
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingAttachment(null);
          setEditDescription('');
        }}
        hasCloseButton
        size="md"
      >
        <ModalDialog.Header>
          <ModalDialog.Title>Edit Description</ModalDialog.Title>
        </ModalDialog.Header>
        <ModalDialog.Body>
          <Stack gap={3}>
            <div>
              <strong>File:</strong> {editingAttachment?.filename}
            </div>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter a description for this document..."
              />
            </Form.Group>
          </Stack>
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <Button
            variant="tertiary"
            onClick={() => {
              setEditModalOpen(false);
              setEditingAttachment(null);
              setEditDescription('');
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditSave}>
            Save Changes
          </Button>
        </ModalDialog.Footer>
      </ModalDialog>

      {/* Delete Confirmation Modal */}
      <ModalDialog
        title="Confirm Delete"
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingAttachment(null);
        }}
        hasCloseButton
        size="sm"
      >
        <ModalDialog.Header>
          <ModalDialog.Title>Confirm Delete</ModalDialog.Title>
        </ModalDialog.Header>
        <ModalDialog.Body>
          <Stack gap={3}>
            <Alert variant="warning">
              <strong>Warning:</strong> This action cannot be undone.
            </Alert>
            <div>
              Are you sure you want to delete <strong>{deletingAttachment?.filename}</strong>?
            </div>
          </Stack>
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <Button
            variant="tertiary"
            onClick={() => {
              setDeleteModalOpen(false);
              setDeletingAttachment(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </ModalDialog.Footer>
      </ModalDialog>
    </Container>
  );
};

export default Documents;

