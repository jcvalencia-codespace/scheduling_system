import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { getClasses, getSubjects, createAssignment, updateAssignment } from '../_actions'
import Swal from 'sweetalert2'

export default function AssignSubjectModal({ isOpen, onClose, onSubmit, editData = null }) {
  const [formData, setFormData] = useState({
    yearLevel: '',
    term: '',
    classes: [],
    subjects: []
  })
  const [availableClasses, setAvailableClasses] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])

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
        const classes = await getClasses(yearLevel);
        console.log('Received classes:', classes); // Debug log
        setAvailableClasses(classes);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    }
  };

  const handleTermChange = async (e) => {
    const term = e.target.value;
    console.log('Selected term:', term); // Debug log
    setFormData(prev => ({ ...prev, term }));
    if (term) {
      try {
        const subjects = await getSubjects(parseInt(term));
        console.log('Received subjects:', subjects); // Debug log
        setAvailableSubjects(subjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    }
  };

  useEffect(() => {
    const loadEditData = async () => {
      if (editData) {
        // Set initial form data with proper array format
        const initialFormData = {
          yearLevel: `${editData.yearLevel} Year`,
          term: editData.term.toString(),
          classes: Array.isArray(editData.classId) 
            ? editData.classId.map(c => c._id)
            : [editData.classId._id],
          subjects: editData.subjects.map(s => s._id)
        };
        setFormData(initialFormData);
        
        // Load classes and subjects
        const classes = await getClasses(initialFormData.yearLevel);
        const subjects = await getSubjects(initialFormData.term);
        
        setAvailableClasses(classes);
        setAvailableSubjects(subjects);
      }
    };

    loadEditData();
  }, [editData]);

  const handleClassesChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      classes: selectedOptions
    }));
  };

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
        // Update existing assignment
        result = await updateAssignment(editData._id, formData);
      } else {
        // Create new assignment
        result = await createAssignment(formData);
      }
      
      if (result.success) {
        Swal.fire({
          title: 'Success!',
          text: result.message,
          icon: 'success',
          confirmButtonColor: '#323E8F'
        });
        // Clear form and pass data back to parent
        onSubmit(formData);
        resetForm();
        onClose();
      } else {
        throw new Error(result.message);
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
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                        <select
                          name="classes"
                          multiple
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-32 overflow-y-auto"
                          required
                          value={formData.classes}
                          onChange={handleClassesChange}
                          size={4}
                        >
                          {availableClasses.map((cls) => (
                            <option 
                              key={cls._id} 
                              value={cls._id} 
                              className={`p-2 ${
                                formData.classes.includes(cls._id) 
                                  ? 'bg-indigo-50 text-indigo-900' 
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {cls.sectionName} - {cls.courseCode}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple classes</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Subjects</label>
                        <select
                          name="subjects"
                          multiple
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-32 overflow-y-auto"
                          required
                          value={formData.subjects}
                          onChange={handleSubjectsChange}
                          size={4}
                        >
                          {availableSubjects.map((subject) => (
                            <option 
                              key={subject._id} 
                              value={subject._id} 
                              className={`p-2 ${
                                formData.subjects.includes(subject._id) 
                                  ? 'bg-indigo-50 text-indigo-900' 
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {subject.subjectCode} - {subject.subjectName}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple subjects</p>
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