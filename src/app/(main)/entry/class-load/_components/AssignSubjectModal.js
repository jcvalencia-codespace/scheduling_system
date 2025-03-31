import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { getClasses, getSubjects, createAssignment, updateAssignment } from '../_actions'
import { DropdownSkeleton } from './SkeletonLoader'
import Swal from 'sweetalert2'
import Select from 'react-select';

const customSelectStyles = {
  option: (styles, { isSelected, isFocused }) => ({
    ...styles,
    backgroundColor: isSelected ? '#323E8F' : isFocused ? '#E2E8F0' : 'white',
    color: isSelected ? 'white' : '#111827', // Changed to gray-900
    ':active': {
      backgroundColor: '#323E8F',
      color: 'white'
    }
  }),
  placeholder: (styles) => ({
    ...styles,
    color: '#111827', // Added gray-900 color for placeholder
  }),
  multiValue: (styles) => ({
    ...styles,
    backgroundColor: '#323E8F15',
    border: '1px solid #323E8F40'
  }),
  multiValueLabel: (styles) => ({
    ...styles,
    color: '#323E8F'
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    ':hover': {
      backgroundColor: '#323E8F',
      color: 'white'
    }
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 99999,
    position: 'relative'
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 99999
  }),
  container: (provided) => ({
    ...provided,
    zIndex: 99999,
    position: 'relative'
  })
};

export default function AssignSubjectModal({ isOpen, onClose, onSubmit, editData = null, userId }) {
  const [formData, setFormData] = useState({
    yearLevel: '',
    term: '',
    classes: [],
    subjects: []
  })
  const [availableClasses, setAvailableClasses] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  const yearLevels = [
    { id: '1st Year', label: '1st Year' },
    { id: '2nd Year', label: '2nd Year' },
    { id: '3rd Year', label: '3rd Year' },
    { id: '4th Year', label: '4th Year' }
  ]

  const terms = [
    { id: 1, label: 'Term 1' },
    { id: 2, label: 'Term 2' },
    { id: 3, label: 'Term 3' }
  ]

  const handleYearLevelChange = async (e) => {
    const yearLevel = e.target.value;
    console.log('Selected year level:', yearLevel); // Debug log
    setFormData(prev => ({ ...prev, yearLevel }));
    
    if (yearLevel) {
      try {
        setIsLoadingClasses(true);
        // Pass the complete year level string
        const classes = await getClasses(yearLevel);
        console.log('Received classes:', classes); // Debug log
        
        if (Array.isArray(classes) && classes.length > 0) {
          setAvailableClasses(classes);
        } else {
          setAvailableClasses([]);
          console.log('No classes found for year level:', yearLevel);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        setAvailableClasses([]);
      } finally {
        setIsLoadingClasses(false);
      }
    } else {
      setAvailableClasses([]);
    }
  };

  const handleTermChange = async (e) => {
    const term = e.target.value;
    
    if (editData?.subjects) {
      // Safely filter subjects by term with null checks
      const termSubjects = editData.subjects
        ?.filter(subj => subj?.term === parseInt(term))
        ?.map(subj => subj?.subject?._id)
        ?.filter(Boolean) || [];
      
      setFormData(prev => ({
        ...prev,
        term,
        subjects: termSubjects
      }));
    } else {
      setFormData(prev => ({ ...prev, term }));
    }
  };

  useEffect(() => {
    const loadEditData = async () => {
      if (editData) {
        try {
          // Safely filter subjects by term with null checks
          const termSubjects = editData.subjects
            ?.filter(subj => subj?.term === parseInt(editData.term))
            ?.map(subj => subj?.subject?._id)
            ?.filter(Boolean) || [];

          // Set initial form data with proper array format and null checks
          const initialFormData = {
            yearLevel: `${editData.yearLevel} Year`,
            term: editData.term?.toString() || '',
            classes: editData.classId ? [editData.classId._id] : [],
            subjects: termSubjects
          };
          setFormData(initialFormData);
          
          // Load classes and subjects
          if (initialFormData.yearLevel) {
            const classes = await getClasses(initialFormData.yearLevel);
            setAvailableClasses(classes || []);
          }
          
          const subjects = await getSubjects();
          setAvailableSubjects(subjects || []);
        } catch (error) {
          console.error('Error loading edit data:', error);
          // Set safe default values
          setFormData({
            yearLevel: '',
            term: '',
            classes: [],
            subjects: []
          });
        }
      }
    };

    loadEditData();
  }, [editData]);

  // Also load subjects when modal opens
  useEffect(() => {
    const loadSubjects = async () => {
      if (isOpen && formData.classes.length > 0) {
        setIsLoadingSubjects(true);
        try {
          // Get the department ID from the first selected class
          const selectedClass = availableClasses.find(c => c._id === formData.classes[0]);
          const departmentId = selectedClass?.course?.department?._id;
          
          console.log('Loading subjects for department:', departmentId);
          
          if (departmentId) {
            const subjects = await getSubjects(departmentId);
            console.log('Fetched subjects:', subjects);
            setAvailableSubjects(subjects || []);
          } else {
            setAvailableSubjects([]);
          }
        } catch (error) {
          console.error('Error loading subjects:', error);
          setAvailableSubjects([]);
        } finally {
          setIsLoadingSubjects(false);
        }
      } else {
        // Clear subjects if no class is selected
        setAvailableSubjects([]);
      }
    };

    loadSubjects();
  }, [isOpen, formData.classes, availableClasses]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // const handleClassesChange = (selected) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     classes: selected ? selected.map(option => option.value) : [],
  //     subjects: [] // Reset subjects when class changes
  //   }));
  //   setAvailableSubjects([]); // Clear available subjects when class changes
  // };

  const handleSubjectsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      subjects: selectedOptions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (editData) {
        result = await updateAssignment(editData._id, formData, userId);
      } else {
        result = await createAssignment(formData, userId);
      }
      
      if (result.success) {
        Swal.fire({
          title: 'Success!',
          text: result.message,
          icon: 'success',
          confirmButtonColor: '#323E8F'
        });
        onSubmit(formData);
        resetForm();
        onClose();
      } else {
        // Show validation error with specific message
        Swal.fire({
          title: 'Cannot Proceed!',
          text: result.message,
          icon: 'warning',
          confirmButtonColor: '#323E8F'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: error.message || 'An unexpected error occurred',
        icon: 'error',
        confirmButtonColor: '#323E8F'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      yearLevel: '',
      term: '',
      classes: [],
      subjects: []
    });
    setAvailableClasses([]);
    setAvailableSubjects([]);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {editData ? 'Edit Subject Assignment' : 'Assign Subjects to Class'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Year Level</label>
                        <select
                          name="yearLevel"
                          onChange={handleYearLevelChange}
                          value={formData.yearLevel}
                          className="mt-1 block w-full text-black rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Select Year Level</option>
                          {yearLevels.map((year) => (
                            <option key={year.id} value={year.id}>
                              {year.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Term</label>
                        <select
                          name="term"
                          onChange={handleTermChange}
                          value={formData.term}
                          className="mt-1 block w-full text-black rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Select Term</option>
                          {terms.map((term) => (
                            <option key={term.id} value={term.id}>
                              {term.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Classes</label>
                        {isLoadingClasses ? (
                          <DropdownSkeleton />
                        ) : (
                          <>
                            <Select
                              isMulti
                              name="classes"
                              options={availableClasses.map(cls => ({
                                value: cls._id,
                                label: `${cls.sectionName} - ${cls.courseCode}`
                              }))}
                              value={formData.classes.map(id => {
                                const cls = availableClasses.find(c => c._id === id);
                                return cls ? {
                                  value: cls._id,
                                  label: `${cls.sectionName} - ${cls.courseCode}`
                                } : null;
                              })}
                              onChange={(selected) => {
                                setFormData(prev => ({
                                  ...prev,
                                  classes: selected ? selected.map(option => option.value) : [],
                                  subjects: [] // Reset subjects when class changes
                                }));
                              }}
                              className="mt-1"
                              classNamePrefix="select"
                              placeholder="Select classes..."
                              noOptionsMessage={() => formData.yearLevel 
                                ? 'No classes available for selected year level' 
                                : 'Select a year level to view available classes'
                              }
                              styles={customSelectStyles}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              {availableClasses.length > 0 
                                ? "You can select multiple classes"
                                : "Select a year level to view available classes"}
                            </p>
                          </>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 z-[99999]">Subjects</label>
                        {isLoadingSubjects ? (
                          <DropdownSkeleton />
                        ) : (
                          <>
                            <Select
                              isMulti
                              name="subjects"
                              isLoading={isLoadingSubjects}
                              options={availableSubjects.map(subject => ({
                                value: subject._id,
                                label: `${subject.subjectCode} - ${subject.subjectName}`
                              }))}
                              value={formData.subjects.map(id => {
                                const subject = availableSubjects.find(s => s._id === id);
                                return subject ? {
                                  value: subject._id,
                                  label: `${subject.subjectCode} - ${subject.subjectName}`
                                } : null;
                              })}
                              onChange={(selected) => {
                                setFormData(prev => ({
                                  ...prev,
                                  subjects: selected ? selected.map(option => option.value) : []
                                }));
                              }}
                              className="mt-1"
                              classNamePrefix="select"
                              placeholder={
                                formData.classes.length === 0
                                  ? "Select a class first"
                                  : "Select subjects..."
                              }
                              noOptionsMessage={() => 
                                formData.classes.length === 0
                                  ? "Select a class first"
                                  : isLoadingSubjects
                                  ? "Loading subjects..."
                                  : "No subjects available"
                              }
                              styles={customSelectStyles}
                              menuPortalTarget={portalTarget}
                              menuPosition={'fixed'}
                              isDisabled={formData.classes.length === 0 || isLoadingSubjects}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              {availableSubjects.length > 0 
                                ? "You can select multiple subjects"
                                : "No subjects available"}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-[#323E8F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#35408E] sm:ml-3 sm:w-auto"
                        >
                          {editData ? 'Update Assignment' : 'Assign Subject'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}