# API Documentation

This directory contains API client modules for interacting with backend services.

## Modules

### `attachments.js`

Handles file attachment management for course creation.

#### Functions:

- **`uploadAttachment(file, description)`**
  - Uploads a document file to the server
  - Parameters:
    - `file`: File object to upload
    - `description`: Optional description
  - Returns: Promise with attachment data including ID, file_path, metadata
  - Max file size: 50MB
  - Supported formats: PDF, Word, PowerPoint, Excel, Text, RTF, CSV

- **`deleteAttachment(attachmentId)`**
  - Deletes an attachment from the server
  - Parameters:
    - `attachmentId`: Numeric ID of the attachment
  - Returns: Promise with deletion confirmation

- **`listAttachments(filters)`**
  - Lists user's attachments with optional filtering
  - Parameters:
    - `filters`: Object with optional `file_type` and `org` properties
  - Returns: Promise with array of attachments

- **`getAttachment(attachmentId)`**
  - Gets detailed information about a specific attachment
  - Parameters:
    - `attachmentId`: Numeric ID of the attachment
  - Returns: Promise with attachment details

- **`updateAttachment(attachmentId, description)`**
  - Updates attachment description
  - Parameters:
    - `attachmentId`: Numeric ID of the attachment
    - `description`: New description
  - Returns: Promise with updated attachment data

- **`bulkDeleteAttachments(attachmentIds)`**
  - Deletes multiple attachments at once
  - Parameters:
    - `attachmentIds`: Array of attachment IDs
  - Returns: Promise with deletion count

### `courseCreator.js`

Handles course generation and structure management.

#### Functions:

- **`createCourse(requestData)`**
  - Creates or updates course content
  - Parameters:
    - `requestData`: Object with course creation parameters
  - Actions:
    - `create_structure`: Generate initial course structure
    - `update_structure`: Modify existing structure
    - `create_content`: Generate full course content
  - Returns: Promise with course structure or generation status

## Usage Examples

### Uploading an Attachment

```javascript
import { uploadAttachment } from './api/attachments';

const file = document.querySelector('input[type="file"]').files[0];
const response = await uploadAttachment(file, 'Course materials');
console.log('Attachment ID:', response.data.attachment.id);
console.log('File path:', response.data.attachment.file_path);
```

### Creating a Course with Attachments

```javascript
import { createCourse } from './api/courseCreator';
import { uploadAttachment } from './api/attachments';

// Upload documents first
const file1 = await uploadAttachment(pdfFile, 'Module 1 materials');
const file2 = await uploadAttachment(pptxFile, 'Presentation slides');

// Create course with attachment paths
const response = await createCourse({
  action: 'create_structure',
  topic: 'Introduction to AI',
  available_components: ['html', 'video', 'problem_multiple_choice'],
  attachment_paths: [
    file1.data.attachment.file_path,
    file2.data.attachment.file_path
  ],
  audience: 'Beginners',
  course_size: 'medium'
});
```

### Deleting an Attachment

```javascript
import { deleteAttachment } from './api/attachments';

await deleteAttachment(attachmentId);
console.log('Attachment deleted successfully');
```

## Error Handling

All API functions throw errors that should be caught and handled:

```javascript
try {
  const response = await uploadAttachment(file);
  // Handle success
} catch (error) {
  if (error.response?.status === 413) {
    console.error('File too large');
  } else if (error.response?.status === 400) {
    console.error('Invalid file format');
  } else {
    console.error('Upload failed:', error.message);
  }
}
```

## Configuration

API endpoints use the `STUDIO_BASE_URL` from the OpenEdX frontend platform configuration:

```javascript
import { getConfig } from '@edx/frontend-platform';

const config = getConfig();
const baseUrl = config.STUDIO_BASE_URL;
```

Ensure `STUDIO_BASE_URL` is properly configured in your environment.

