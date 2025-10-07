import { Button, Stack, Form, Card, IconButton, Icon, Spinner } from '@edx/paragon';
import { Add, Delete, Edit, Check, Close } from '@edx/paragon/icons';
import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';

// Utility function to generate unique IDs
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Utility function to ensure all structure items have unique IDs
const ensureUniqueIds = (structure) => {
  if (!structure || !structure.sections) return structure;

  const newStructure = { ...structure };
  newStructure.sections = structure.sections.map((section) => {
    const newSection = {
      ...section,
      id: section.id || generateId()
    };

    if (section.subsections) {
      newSection.subsections = section.subsections.map((subsection) => {
        const newSubsection = {
          ...subsection,
          id: subsection.id || generateId()
        };

        if (subsection.units) {
          newSubsection.units = subsection.units.map((unit) => ({
            ...unit,
            id: unit.id || generateId()
          }));
        }

        return newSubsection;
      });
    }

    return newSection;
  });

  return newStructure;
};

const StructureView = ({
  structure,
  setStructure,
  handleStructureApproval,
  isResponseLoading,
  formData,
  setFormData,
  triggerAnimation = false,
  onAnimationTriggered,
  isEditingStructure = false,
  setIsEditingStructure
}) => {
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Ensure structure has unique IDs
  useEffect(() => {
    if (structure && !structure._hasIds) {
      const structureWithIds = ensureUniqueIds(structure);
      structureWithIds._hasIds = true;
      setStructure(structureWithIds);
    }
  }, [structure, setStructure]);

  // Handle drag and drop
  const handleDragEnd = useCallback((result) => {
    const { destination, source, type } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    if (editingItem) return;

    if (setIsEditingStructure) {
      setIsEditingStructure(true);
    }

    const newStructure = JSON.parse(JSON.stringify(structure));

    try {
      if (type === 'section') {
        const sections = Array.from(newStructure.sections);
        const [movedSection] = sections.splice(source.index, 1);
        sections.splice(destination.index, 0, movedSection);
        newStructure.sections = sections;
      } else if (type === 'subsection') {
        // Extract section ID from droppable ID (format: "subsections-{sectionId}")
        const sourceSectionId = source.droppableId.replace('subsections-', '');
        const destSectionId = destination.droppableId.replace('subsections-', '');

        // Find source and destination sections
        const sourceSection = newStructure.sections.find(s => s.id === sourceSectionId);
        const destSection = newStructure.sections.find(s => s.id === destSectionId);

        if (sourceSection && destSection && sourceSection.subsections && destSection.subsections) {
          // Moving within the same section
          if (sourceSectionId === destSectionId) {
            const subsections = Array.from(sourceSection.subsections);
            const [movedSubsection] = subsections.splice(source.index, 1);
            subsections.splice(destination.index, 0, movedSubsection);
            sourceSection.subsections = subsections;
          } else {
            // Moving to a different section
            const sourceSubsections = Array.from(sourceSection.subsections);
            const [movedSubsection] = sourceSubsections.splice(source.index, 1);
            sourceSection.subsections = sourceSubsections;

            const destSubsections = Array.from(destSection.subsections);
            destSubsections.splice(destination.index, 0, movedSubsection);
            destSection.subsections = destSubsections;
          }
        }
      }

      setStructure(newStructure);

      setTimeout(() => {
        if (setIsEditingStructure) {
          setIsEditingStructure(false);
        }
      }, 100);
    } catch (error) {
      console.error('Error during drag and drop:', error);
      if (setIsEditingStructure) {
        setIsEditingStructure(false);
      }
    }
  }, [structure, editingItem, setStructure, setIsEditingStructure]);

  const startEdit = (type, id, currentValue) => {
    setEditingItem({ type, id });
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (!editingItem || !editValue.trim()) {
      setEditingItem(null);
      setEditValue("");
      return;
    }

    const newStructure = JSON.parse(JSON.stringify(structure));
    const { type, id } = editingItem;

    if (type === 'section') {
      const section = newStructure.sections.find(s => s.id === id);
      if (section) section.name = editValue;
    } else if (type === 'subsection') {
      for (const section of newStructure.sections) {
        const subsection = section.subsections?.find(ss => ss.id === id);
        if (subsection) {
          subsection.name = editValue;
          break;
        }
      }
    } else if (type === 'unit') {
      for (const section of newStructure.sections) {
        for (const subsection of section.subsections || []) {
          const unit = subsection.units?.find(u => u.id === id);
          if (unit) {
            unit.name = editValue;
            break;
          }
        }
      }
    }

    setStructure(newStructure);
    setEditingItem(null);
    setEditValue("");
  };

  const handleDelete = (type, id) => {
    const newStructure = JSON.parse(JSON.stringify(structure));

    if (type === 'section') {
      newStructure.sections = newStructure.sections.filter(s => s.id !== id);
    }

    setStructure(newStructure);
  };


  if (!structure || !structure.sections) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <Stack gap={3}>
        <div className="d-flex justify-content-between align-items-center">
          <h3>Course Structure</h3>
          <Button variant="primary" onClick={() => handleStructureApproval({})} disabled={isResponseLoading}>
            Approve & Generate
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections" type="section">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <Stack gap={3}>
                  {structure.sections.map((section, sIndex) => (
                    <Draggable key={section.id} draggableId={section.id} index={sIndex}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <Card
                            {...provided.dragHandleProps}
                            className="shadow-sm"
                          >
                            <Card.Header className="bg-primary text-white">
                              {editingItem?.type === 'section' && editingItem?.id === section.id ? (
                                <Stack direction="horizontal" gap={2}>
                                  <Form.Control
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    autoFocus
                                  />
                                  <IconButton src={Check} iconAs={Icon} alt="Save" onClick={handleSave} />
                                  <IconButton src={Close} iconAs={Icon} alt="Cancel" onClick={() => setEditingItem(null)} />
                                </Stack>
                              ) : (
                                <Stack direction="horizontal" gap={2} className="justify-content-between">
                                  <span className="fw-bold">Section {sIndex + 1}: {section.name}</span>
                                  <Stack direction="horizontal" gap={2}>
                                    <IconButton
                                      src={Edit}
                                      iconAs={Icon}
                                      alt="Edit"
                                      onClick={() => startEdit('section', section.id, section.name)}
                                      variant="light"
                                      size="sm"
                                    />
                                    <IconButton
                                      src={Delete}
                                      iconAs={Icon}
                                      alt="Delete"
                                      onClick={() => handleDelete('section', section.id)}
                                      variant="light"
                                      size="sm"
                                    />
                                  </Stack>
                                </Stack>
                              )}
                            </Card.Header>
                            <Card.Body>
                              {section.subsections && section.subsections.length > 0 && (
                                <Droppable droppableId={`subsections-${section.id}`} type="subsection">
                                  {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                      <Stack gap={2}>
                                        {section.subsections.map((subsection, ssIndex) => (
                                          <Draggable key={subsection.id} draggableId={subsection.id} index={ssIndex}>
                                            {(provided) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="p-3 border rounded bg-light"
                                              >
                                                <div className="fw-bold mb-2">
                                                  {subsection.name}
                                                </div>
                                                {subsection.units && subsection.units.length > 0 && (
                                                  <Stack gap={1} className="ms-3">
                                                    {subsection.units.map((unit) => (
                                                      <div key={unit.id} className="small text-muted">
                                                        • {unit.name}
                                                      </div>
                                                    ))}
                                                  </Stack>
                                                )}
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </Stack>
                                    </div>
                                  )}
                                </Droppable>
                              )}
                            </Card.Body>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Stack>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Stack>

    </div>
  );
};

StructureView.propTypes = {
  structure: PropTypes.object,
  setStructure: PropTypes.func.isRequired,
  handleStructureApproval: PropTypes.func.isRequired,
  isResponseLoading: PropTypes.bool,
  triggerAnimation: PropTypes.bool,
  onAnimationTriggered: PropTypes.func,
  isEditingStructure: PropTypes.bool,
  setIsEditingStructure: PropTypes.func,
};

export default StructureView;

