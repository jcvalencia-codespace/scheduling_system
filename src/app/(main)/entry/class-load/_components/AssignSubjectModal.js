"use client"

import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, PlusIcon, TrashIcon, BookOpenIcon } from "@heroicons/react/24/outline"
import { getClasses, getSubjects, createAssignment, updateAssignment, getActiveTerm, getTermDetails } from "../_actions"
import { DropdownSkeleton } from "./SkeletonLoader"
import Swal from "sweetalert2"
import Select from "react-select"
import AssignModalSidebar from "./AssignModalSidebar"

const customSelectStyles = {
  control: (styles) => ({
    ...styles,
    borderRadius: "0.5rem",
    borderColor: "#E2E8F0",
    boxShadow: "none",
    minHeight: "42px",
    backgroundColor: 'var(--bg-control, white)',
    "&:hover": {
      borderColor: "#323E8F",
    },
    padding: "0 4px",
  }),
  option: (styles, { isSelected, isFocused }) => ({
    ...styles,
    backgroundColor: isSelected ? "#323E8F" : isFocused ? "#F3F4F6" : "white",
    color: isSelected ? "white" : "#111827",
    padding: "10px 12px",
    ":active": {
      backgroundColor: "#323E8F",
      color: "white",
    },
  }),
  placeholder: (styles) => ({
    ...styles,
    color: "#6B7280",
  }),
  multiValue: (styles) => ({
    ...styles,
    backgroundColor: "#EEF2FF",
    borderRadius: "0.375rem",
    border: "1px solid #323E8F20",
  }),
  multiValueLabel: (styles) => ({
    ...styles,
    color: "#323E8F",
    fontWeight: 500,
    padding: "2px 6px",
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    borderRadius: "0 0.375rem 0.375rem 0",
    ":hover": {
      backgroundColor: "#323E8F",
      color: "white",
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999999,
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999999,
  }),
  menuList: (provided) => ({
    ...provided,
    zIndex: 9999999,
    padding: "6px",
    borderRadius: "0.5rem",
    backgroundColor: 'var(--bg-menu, white)',
  }),
  container: (provided) => ({
    ...provided,
    zIndex: 9999999,
    position: "relative",
  }),
  group: (styles) => ({
    ...styles,
    padding: "4px",
  }),
  groupHeading: (styles) => ({
    ...styles,
    color: "#4B5563",
    fontSize: "0.875rem",
    fontWeight: "600",
    textTransform: "none",
    padding: "8px 12px",
    backgroundColor: "#F3F4F6",
    marginBottom: "4px",
    borderRadius: "0.375rem",
  })
}

export default function AssignSubjectModal({ isOpen, onClose, onSubmit, editData = null, userId }) {
  const [formData, setFormData] = useState({
    yearLevel: "",
    term: "",
    classes: [],
    subjectAssignments: [],
  })
  const [availableClasses, setAvailableClasses] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [portalTarget, setPortalTarget] = useState(null)
  const [allSubjects, setAllSubjects] = useState([])
  const [termInfo, setTermInfo] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [termDetails, setTermDetails] = useState([]);
  const [isTermLoading, setIsTermLoading] = useState(true);

  const yearLevels = [
    { id: "1st Year", label: "1st Year" },
    { id: "2nd Year", label: "2nd Year" },
    { id: "3rd Year", label: "3rd Year" },
    { id: "4th Year", label: "4th Year" },
  ]

  useEffect(() => {
    const loadTermDetails = async () => {
      try {
        setIsTermLoading(true);
        const { success, terms } = await getTermDetails([1, 2, 3]);
        if (success) {
          setTermDetails(terms);
        }
      } catch (error) {
        console.error('Error loading terms:', error);
      } finally {
        setIsTermLoading(false);
      }
    };

    if (isOpen) {
      loadTermDetails();
    }
  }, [isOpen]);

  const termOptions = [1, 2, 3].map(termNum => {
    const termDetail = termDetails.find(t => t.term === `Term ${termNum}`);
    return {
      id: termNum,
      label: `Term ${termNum}`,
      isAvailable: termDetail?.isVisible || false,
      academicYear: termDetail?.academicYear
    };
  });

  const handleYearLevelChange = async (e) => {
    const yearLevel = e.target.value
    setFormData((prev) => ({ ...prev, yearLevel }))

    if (yearLevel) {
      try {
        setIsLoadingClasses(true)
        setIsLoadingSubjects(true)

        // Get all subjects immediately
        const subjects = await getSubjects(); // No department filter
        setAvailableSubjects(subjects);
        setAllSubjects(subjects);

        // Then get classes for the specific role
        const classes = await getClasses(yearLevel, userId);
        if (Array.isArray(classes) && classes.length > 0) {
          setAvailableClasses(classes)
        } else {
          setAvailableClasses([])
        }

      } catch (error) {
        console.error("Error fetching data:", error)
        setAvailableClasses([])
        setAvailableSubjects([])
      } finally {
        setIsLoadingClasses(false)
        setIsLoadingSubjects(false)
      }
    } else {
      setAvailableClasses([])
      setAvailableSubjects([])
    }
  }

  const handleTermChange = async (e) => {
    const term = e.target.value;

    if (editData?.subjects) {
      // Filter subjects for the selected term
      const termSubjects = editData.subjects
        ?.filter(subj => subj?.term === Number(term))
        ?.map(subj => ({
          subjectId: subj?.subject?._id,
          hours: subj?.hours?.toString() || ""
        }))
        ?.filter(Boolean) || [];

      setFormData(prev => ({
        ...prev,
        term,
        subjectAssignments: termSubjects
      }));
    } else {
      setFormData(prev => ({ ...prev, term }));
    }
  };

  useEffect(() => {
    const loadEditData = async () => {
      if (editData) {
        try {
          // Extract subjects for the current term
          const termSubjects = editData.subjects
            ?.filter(subj => subj?.term === Number(editData.term))
            ?.map(subj => ({
              subjectId: subj?.subject?._id,
              hours: subj?.hours?.toString() || ""
            }))
            ?.filter(Boolean) || [];

          // Initialize form data
          const initialFormData = {
            yearLevel: editData.yearLevel ? `${editData.yearLevel} Year` : "",
            term: editData.term?.toString() || "",
            classes: editData.classId ? [editData.classId._id] : [],
            subjectAssignments: termSubjects // Make sure subjects are properly mapped
          };

          // Fetch classes for the year level
          if (initialFormData.yearLevel) {
            const classes = await getClasses(initialFormData.yearLevel, userId);
            setAvailableClasses(classes || []);
          }

          // Fetch all subjects
          const subjects = await getSubjects();
          setAvailableSubjects(subjects || []);
          setAllSubjects(subjects || []);

          // Set form data after all data is loaded
          setFormData(initialFormData);

          console.log('Edit Data:', {
            editData,
            initialFormData,
            termSubjects,
            subjects: subjects?.length
          });
        } catch (error) {
          console.error("Error loading edit data:", error);
          setFormData({
            yearLevel: "",
            term: "",
            classes: [],
            subjectAssignments: []
          });
        }
      }
    };

    loadEditData();
  }, [editData, userId]);

  useEffect(() => {
    const loadAllSubjects = async () => {
      if (isOpen) {
        setIsLoadingSubjects(true)
        try {
          const subjects = await getSubjects()
          setAllSubjects(subjects)
          setAvailableSubjects(subjects)
        } catch (error) {
          console.error("Error loading all subjects:", error)
        } finally {
          setIsLoadingSubjects(false)
        }
      }
    }
    loadAllSubjects()
  }, [isOpen])

  useEffect(() => {
    const loadActiveTerm = async () => {
      if (isOpen) {
        try {
          const { success, term } = await getActiveTerm()
          if (success) {
            setTermInfo(term)
          }
        } catch (error) {
          console.error("Error loading active term:", error)
        }
      }
    }
    loadActiveTerm()
  }, [isOpen])

  useEffect(() => {
    if (formData.classes.length > 0) {
      // Keep all subjects available regardless of selected class
      setAvailableSubjects(allSubjects)
    } else {
      setAvailableSubjects(allSubjects)
    }
  }, [formData.classes, allSubjects])

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  const addSubjectField = () => {
    setFormData((prev) => ({
      ...prev,
      subjectAssignments: [...prev.subjectAssignments, { subjectId: "", hours: "" }],
    }))
  }

  const removeSubjectField = (index) => {
    setFormData((prev) => ({
      ...prev,
      subjectAssignments: prev.subjectAssignments.filter((_, i) => i !== index),
    }))
  }

  const handleSubjectFieldChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      subjectAssignments: prev.subjectAssignments.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value }
        }
        return item
      }),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)

      if (!termInfo) {
        throw new Error("Active term information is required")
      }

      const isValid = formData.subjectAssignments.every((assignment) => assignment.subjectId && assignment.hours)

      if (!isValid) {
        throw new Error("Please fill in all subject and hours fields")
      }

      const submissionData = {
        ...formData,
        academicYear: termInfo.sy,
        termId: termInfo._id,
        subjects: formData.subjectAssignments,
      }

      let result
      if (editData) {
        result = await updateAssignment(editData._id, submissionData, userId)
      } else {
        result = await createAssignment(submissionData, userId)
      }

      if (result.success) {
        Swal.fire({
          title: "Success!",
          text: result.message,
          icon: "success",
          confirmButtonColor: "#323E8F",
        })
        onSubmit(formData)
        resetForm()
        onClose()
      } else {
        Swal.fire({
          title: "Cannot Proceed!",
          text: result.message,
          icon: "warning",
          confirmButtonColor: "#323E8F",
        })
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message || "An unexpected error occurred",
        icon: "error",
        confirmButtonColor: "#323E8F",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      yearLevel: "",
      term: "",
      classes: [],
      subjectAssignments: [],
    })
    setAvailableClasses([])
    setAvailableSubjects([])
  }

  const getSubjectName = (subjectId) => {
    const subject = availableSubjects.find((s) => s._id === subjectId)
    return subject ? `${subject.subjectCode} - ${subject.subjectName}` : ""
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm z-[9999]" />
        </Transition.Child>

        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 w-full max-w-5xl">
                <div className="absolute right-0 top-0 pr-4 pt-4 block z-[9999]">
                  <button
                    type="button"
                    className="rounded-full bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 transition-colors shadow-sm"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row">
                  <AssignModalSidebar editData={editData} termInfo={termInfo} />
                  {/* Main content */}
                  <div className="w-full md:w-2/3 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year Level</label>
                          <select
                            name="yearLevel"
                            onChange={handleYearLevelChange}
                            value={formData.yearLevel}
                            className="block w-full text-black dark:text-white rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm h-[42px] dark:bg-gray-700"
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
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
                          <select
                            name="term"
                            onChange={handleTermChange}
                            value={formData.term}
                            className="block w-full text-black dark:text-white rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm h-[42px] dark:bg-gray-700"
                            required
                            disabled={isTermLoading}
                          >
                            <option value="">Select Term</option>
                            {termOptions.map((term) => (
                              <option 
                                key={term.id} 
                                value={term.id} 
                                disabled={!term.isAvailable}
                                className={!term.isAvailable ? "text-gray-400" : "text-black"}
                              >
                                {term.label} {!term.isAvailable ? "(Not Set)" : `(${term.academicYear})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classes</label>
                        {isLoadingClasses ? (
                          <DropdownSkeleton />
                        ) : (
                          <>
                            <Select
                              isMulti
                              name="classes"
                              options={availableClasses.map((cls) => ({
                                value: cls._id,
                                label: `${cls.sectionName} - ${cls.courseCode}`,
                              }))}
                              value={formData.classes.map((id) => {
                                const cls = availableClasses.find((c) => c._id === id)
                                return cls
                                  ? {
                                      value: cls._id,
                                      label: `${cls.sectionName} - ${cls.courseCode}`,
                                    }
                                  : null
                              })}
                              onChange={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  classes: selected ? selected.map((option) => option.value) : [],
                                  subjectAssignments: [],
                                }))
                              }}
                              className="mt-1"
                              classNamePrefix="select"
                              placeholder="Select classes..."
                              noOptionsMessage={() =>
                                formData.yearLevel
                                  ? "No classes available for selected year level"
                                  : "Select a year level to view available classes"
                              }
                              styles={customSelectStyles}
                              menuPortalTarget={portalTarget}
                              menuShouldBlockScroll={true}
                              menuPlacement="auto"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {availableClasses.length > 0
                                ? "You can select multiple classes"
                                : "Select a year level to view available classes"}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="space-y-4 ">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <BookOpenIcon className="h-5 w-5 text-[#323E8F] mr-2" />
                            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Subjects and Hours</h3>
                          </div>
                          <button
                            type="button"
                            onClick={addSubjectField}
                            disabled={formData.classes.length === 0}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#323E8F] hover:bg-[#35408E] disabled:opacity-50 transition-colors shadow-sm"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Subject
                          </button>
                        </div>

                        {formData.subjectAssignments.length > 0 ? (
                          <div className="overflow-hidden rounded-lg overflow-y-auto max-h-[350px] border border-gray-200 dark:border-gray-700 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700">
                                  <th
                                    scope="col"
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                  >
                                    Subject
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24"
                                  >
                                    Hours
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16"
                                  >
                                    <span className="sr-only">Actions</span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {formData.subjectAssignments.map((assignment, index) => (
                                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-4 py-3">
                                      <Select
                                        value={availableSubjects
                                          .filter(subject => subject._id === assignment.subjectId)
                                          .map(subject => ({
                                            value: subject._id,
                                            label: `${subject.subjectCode} - ${subject.subjectName}`
                                          }))[0]}
                                        onChange={(selected) => handleSubjectFieldChange(index, "subjectId", selected?.value || "")}
                                        options={availableSubjects
                                          .filter(subject => {
                                            if (subject._id === assignment.subjectId) return true;
                                            return !formData.subjectAssignments.some(
                                              (a) => a.subjectId === subject._id
                                            );
                                          })
                                          .map(subject => ({
                                            value: subject._id,
                                            label: `${subject.subjectCode} - ${subject.subjectName}`,
                                            department: subject.department?.departmentCode || 'No Department',
                                            searchKey: `${subject.subjectCode} ${subject.subjectName} ${subject.department?.departmentCode || ''}`
                                          }))
                                          .reduce((groups, subject) => {
                                            const group = groups.find(g => g.label === subject.department);
                                            if (group) {
                                              group.options.push({
                                                value: subject.value,
                                                label: subject.label,
                                                data: subject
                                              });
                                            } else {
                                              groups.push({
                                                label: subject.department,
                                                options: [{
                                                  value: subject.value,
                                                  label: subject.label,
                                                  data: subject
                                                }]
                                              });
                                            }
                                            return groups;
                                          }, [])}
                                        filterOption={(option, inputValue) => {
                                          const data = option.data?.data || option.data;
                                          return data?.searchKey?.toLowerCase().includes(inputValue.toLowerCase());
                                        }}
                                        styles={customSelectStyles}
                                        placeholder="Select Subject"
                                        isClearable
                                        menuPortalTarget={portalTarget}
                                        classNamePrefix="select"
                                        required
                                      />
                                    </td>
                                    <td className="px-2 py-3">
                                      <input
                                        type="number"
                                        value={assignment.hours}
                                        onChange={(e) => handleSubjectFieldChange(index, "hours", e.target.value)}
                                        placeholder="Hours"
                                        className="block text-black dark:text-white w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#323E8F] focus:ring-[#323E8F] sm:text-sm dark:bg-gray-700"
                                        required
                                        min="0"
                                        step="0.001"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => removeSubjectField(index)}
                                        className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-700 rounded-full transition-colors"
                                        aria-label="Remove subject"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="py-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
                            {formData.classes.length === 0 ? (
                              <div className="text-center">
                                <BookOpenIcon className="h-10 w-10 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">Select a class first to add subjects</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Year level and class selection is required</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <BookOpenIcon className="h-10 w-10 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-300 mb-3">No subjects added yet</p>
                                <button
                                  type="button"
                                  onClick={addSubjectField}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#323E8F] hover:bg-[#35408E] transition-colors shadow-sm"
                                >
                                  <PlusIcon className="h-4 w-4 mr-1" />
                                  Add Subject
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex justify-center items-center rounded-md bg-[#323E8F] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#35408E] transition-colors disabled:opacity-70"
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>{editData ? "Update Assignment" : "Assign Subject"}</>
                          )}
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
