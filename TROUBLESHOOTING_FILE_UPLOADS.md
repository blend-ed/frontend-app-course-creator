# Troubleshooting File Upload Issues

## Common Issue: "The submitted data was not a file"

This error occurs when the file upload request doesn't properly send the file as multipart/form-data.

### Root Causes & Fixes

#### 1. **Content-Type Header Misconfiguration** ✅ FIXED

**Problem**: When uploading files with FormData, manually setting the `Content-Type` header prevents the browser from adding the required `boundary` parameter.

**Solution**: 
```javascript
// ❌ WRONG - Don't do this
headers: {
  'Content-Type': 'multipart/form-data'
}

// ✅ CORRECT - Let browser set it automatically
headers: {
  // Don't set Content-Type at all, or explicitly delete it
}
```

**Our Fix**: In `ChatInterface.jsx`, we now explicitly delete any Content-Type headers:
```javascript
if (axiosConfig.headers['Content-Type']) {
  delete axiosConfig.headers['Content-Type'];
}
```

#### 2. **Not Using Paragon Dropzone's requestConfig** ✅ FIXED

**Problem**: Paragon's Dropzone provides a `requestConfig` object that contains important axios configuration for progress tracking and cancellation.

**Solution**: Always spread the `requestConfig` when making the axios call:
```javascript
await getAuthenticatedHttpClient().post(url, formData, {
  ...requestConfig,  // ✅ Include this!
  // other config...
});
```

#### 3. **FormData Not Created Properly** ✅ FIXED

**Problem**: Paragon's Dropzone passes `fileData` as a FormData object, not a File object. We were appending the FormData to a new FormData, resulting in `[object FormData]` being sent.

**Solution**:
```javascript
// ❌ WRONG - Don't create new FormData from existing FormData
const formData = new FormData();
formData.append('file', fileData); // fileData is already FormData!

// ✅ CORRECT - Extract the File object first
const file = fileData.get('file'); // Get the actual File object
const formData = new FormData();
formData.append('file', file);
formData.append('description', description);
```

**Our Fix**: In `ChatInterface.jsx`, we now extract the file:
```javascript
const file = fileData.get('file'); // Extract File from FormData
const formData = new FormData();
formData.append('file', file);
formData.append('description', `Course material: ${file?.name}`);
```

### Debugging Steps

The upload function now includes extensive logging. Check your browser console for:

```
Processing upload for file: [filename] Type: [mime-type] Size: [bytes]
FormData entries:
  file [File object]
  description [string]
Uploading to: [API URL]
Request config: [object]
Upload successful: [response data]
```

### If Upload Still Fails

1. **Check the Console Logs**:
   - Does the file object look correct?
   - Is the URL correct?
   - What headers are being sent?

2. **Check Network Tab**:
   - Open DevTools → Network tab
   - Find the POST request to `/api/attachments/`
   - Check the Request Headers - should have:
     ```
     Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
     ```
   - Check the Request Payload - should show the file data

3. **Verify File Object**:
   ```javascript
   console.log('File:', fileData);
   console.log('Is File?', fileData instanceof File);
   console.log('Has blob?', fileData instanceof Blob);
   ```

4. **Check Backend Logs**:
   - The Django server logs might have more details about why it's rejecting the file
   - Look for Content-Type parsing errors

### Testing Different Scenarios

Test with these file types to ensure everything works:

```javascript
// Test files
const tests = [
  { name: 'document.pdf', type: 'application/pdf', size: '1MB' },
  { name: 'presentation.pptx', type: 'application/vnd...ppt', size: '5MB' },
  { name: 'spreadsheet.xlsx', type: 'application/vnd...sheet', size: '2MB' },
  { name: 'notes.txt', type: 'text/plain', size: '10KB' },
];
```

### Known Working Configuration

```javascript
// This is the confirmed working setup in ChatInterface.jsx

// ✅ CRITICAL: Extract File object from Paragon's FormData
const file = fileData.get('file'); // fileData is FormData, not File!

// Create new FormData with the extracted File
const formData = new FormData();
formData.append('file', file);
formData.append('description', `Course material: ${file?.name}`);

const envConfig = getConfig();
const baseUrl = envConfig.STUDIO_BASE_URL;
const url = `${baseUrl}/blendxcoursecreator_enterprise/api/attachments/`;

const axiosConfig = {
  ...requestConfig,
  headers: {
    ...(requestConfig?.headers || {}),
  }
};

// Remove Content-Type to let browser set it with boundary
delete axiosConfig.headers['Content-Type'];
delete axiosConfig.headers['content-type'];

const response = await getAuthenticatedHttpClient().post(url, formData, axiosConfig);
```

### Alternative: Check Backend API

If the issue persists, verify the backend API accepts the request:

```bash
# Test with curl
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "description=Test upload" \
  http://your-studio-url/blendxcoursecreator_enterprise/api/attachments/
```

If curl works but the browser doesn't, it's definitely a client-side issue (likely headers).

### Quick Checklist

- [x] FormData created with actual File object
- [x] Content-Type header NOT manually set
- [x] requestConfig from Dropzone is used
- [x] Using getAuthenticatedHttpClient() from @edx/frontend-platform
- [x] STUDIO_BASE_URL is correctly configured
- [ ] File is under 50MB
- [ ] File type is in the accepted list
- [ ] Network tab shows correct Content-Type with boundary
- [ ] Backend endpoint is accessible and properly configured

### Still Having Issues?

1. Check if axios has any global interceptors that modify requests
2. Verify the authenticated HTTP client doesn't have default transformers that affect FormData
3. Try uploading directly without Paragon Dropzone (use hidden file input)
4. Check if CORS is properly configured on the backend
5. Verify CSRF token is being sent correctly

## Contact

If you continue to experience issues after following this guide, please provide:
1. Browser console logs (all output from the upload function)
2. Network tab screenshot showing the request headers and payload
3. Backend error logs
4. File type and size you're trying to upload

