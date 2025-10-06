# AI Course Creator - Paragon Implementation

This document describes the refactored AI Course Creator implementation using Paragon components.

## Overview

The AI Course Creator has been completely rebuilt using Paragon components and following the UX patterns from the example implementation. The app provides a conversational interface for creating Open edX courses with AI assistance.

## Architecture

### Component Structure

```
src/components/ai-course-creator/
├── index.js                    # Main exports
├── HeroSection.jsx             # Initial landing page with topic input
├── StepsInvolved.jsx           # Visual representation of the creation process
├── ChatInterface.jsx           # Main chat UI with message display
├── ChatSidebar.jsx             # Sidebar showing course configuration
├── ChatFlow.jsx                # Orchestrates the conversational flow
├── StructureView.jsx           # Displays and edits course structure
├── modals/
│   ├── ApprovalModal.jsx       # Final approval before generation
│   └── GenerationProgressModal.jsx  # Shows progress during course generation
├── utils/
│   ├── chatHandlers.js         # Chat response logic
│   ├── durationMapping.js      # Maps UI values to API values
│   └── smartDefaults.js        # Intelligent default suggestions
└── styles.scss                 # Minimal custom styling

src/pages/main/
├── index.jsx                   # Page export
└── AICourseCreator.jsx         # Main page component with state management
```

## Paragon Components Used

### Core Components
- **Form.Control** - Text inputs and textareas
- **Button** - Primary actions and options
- **Stack** - Layout and spacing
- **Card** - Content grouping
- **Container/Row/Col** - Grid layout
- **Spinner** - Loading states
- **ProgressBar** - Generation progress
- **Alert** - Error messages
- **Badge** - File attachments display

### Advanced Components
- **Dropzone** - File upload with drag-and-drop
- **ModalDialog** - Approval and progress modals
- **Dropdown** - Sidebar property and option selection
- **Icon/IconButton** - Actions with icons

### Third-Party Integrations
- **react-beautiful-dnd** - Drag-and-drop for structure editing

## User Flow

1. **Landing Page**: User enters course topic
2. **Document Upload**: Optional document upload for context
3. **Audience Selection**: Choose target audience
4. **Duration Selection**: Choose course length
5. **Component Selection**: Multi-select content components
6. **Assessment Selection**: Multi-select assessment types
7. **Confirmation**: Review and add final instructions
8. **Generation**: AI generates course structure
9. **Structure Review**: Edit and refine structure
10. **Approval**: Submit for final generation
11. **Progress**: Monitor generation progress
12. **Download**: Download generated course

## Key Features

### Conversational Interface
- Natural language interaction
- Context-aware responses
- Smart defaults based on topic
- Multi-step wizard feel

### File Upload
- Paragon Dropzone component
- Support for PDF, PPTX, DOCX
- Progress tracking
- Error handling with retry

### Course Structure Editing
- Drag-and-drop reordering
- Inline editing
- Real-time updates
- Hierarchical display (Sections > Subsections > Units)

### Sidebar Configuration
- Live course data display
- Quick property editing
- Component management
- Assessment management
- Reference tracking

### Generation Progress
- Real-time progress tracking
- Step-by-step visualization
- Email notification
- Direct download and preview

## API Integration

### Endpoints

1. **Document Upload**
   ```
   POST /api/course-creator/document
   ```

2. **Create Structure**
   ```
   POST /api/course-creator/create
   Body: { action: 'create_structure', topic, available_components, ... }
   ```

3. **Update Structure**
   ```
   POST /api/course-creator/create
   Body: { action: 'update_structure', course_structure, instructions, ... }
   ```

4. **Create Content**
   ```
   POST /api/course-creator/create
   Body: { action: 'create_content', course_structure, email, name, ... }
   ```

5. **Check Metadata**
   ```
   GET /api/course-creator/metadata?topic=...&email=...
   ```

## State Management

The app uses React hooks for state management:

- **Course Data**: Topic, audience, duration, components, documents
- **Chat State**: Messages, current step, selected options
- **UI State**: Loading, uploading, editing states
- **Multi-select**: Tracks temporary selections
- **Generation**: Progress, structure, approval data

## Styling Approach

### Paragon-First
- All components use Paragon's built-in styling
- Leverages Paragon's theme system
- Minimal custom CSS

### Custom Styling
Only added where necessary:
- Gradient text effects
- Fade-in animations
- Typing indicator
- Smooth transitions

## Error Handling

- Network error recovery
- File upload validation
- Generation failure handling
- User-friendly error messages
- Retry mechanisms

## Performance Optimizations

- useCallback for event handlers
- useMemo for computed values
- Race condition protection with AbortController
- Cleanup on component unmount
- Efficient re-renders with proper dependencies

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- ARIA labels (via Paragon)
- Focus management
- Screen reader friendly

## Dependencies

### Required Packages
- `@edx/paragon` - UI component library
- `react-beautiful-dnd` - Drag and drop
- `@edx/frontend-platform` - OpenEdX integration
- `axios` - HTTP client (via Paragon Dropzone)

### Optional Enhancements
- Icon library for better visual feedback
- Animation library for transitions
- Toast notifications for better UX

## Development

### Running Locally
```bash
npm install
npm start
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Future Enhancements

1. **Enhanced Animations**: Add more sophisticated animations for state transitions
2. **Offline Support**: Cache course data for offline editing
3. **Collaboration**: Real-time collaboration on course structure
4. **Templates**: Pre-built course templates
5. **Advanced Editing**: Rich text editing for course components
6. **Preview**: Live preview of course structure
7. **Analytics**: Track user interactions and optimize flow
8. **Internationalization**: Multi-language support

## Migration Notes

### From Example Implementation

The Paragon implementation maintains the same UX flow as the example but with several improvements:

1. **Consistent Styling**: All components use Paragon's design system
2. **Better Integration**: Native OpenEdX platform integration
3. **Accessibility**: Built-in accessibility features from Paragon
4. **Maintainability**: Standard component library reduces custom code
5. **Theme Support**: Automatic support for platform theming

### Breaking Changes

- Custom Bootstrap classes replaced with Paragon equivalents
- Icon library changed to Paragon's icon system
- Modal implementation uses ModalDialog instead of react-bootstrap Modal
- Dropzone uses Paragon's Dropzone instead of react-dropzone

## Support

For issues or questions:
1. Check Paragon documentation: https://paragon-openedx.netlify.app/
2. Review OpenEdX frontend platform docs
3. Check the example implementation for UX reference

## License

AGPL-3.0 (same as OpenEdX platform)

