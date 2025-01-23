export const mockSchedules = [
  {
    id: '1',
    sectionName: 'BSCS 4A',
    subjectCode: 'AALGTRIG',
    subjectName: 'Algebra and Trigonometry',
    faculty: {
      id: 'f1',
      firstName: 'P.',
      lastName: 'Cabance',
      department: 'College of Computer Studies'
    },
    room: {
      roomCode: 'S16',
      roomName: 'Room S16',
      type: 'Lecture',
      floor: '1st Floor'
    },
    scheduleType: 'Lecture',
    days: ['Wednesday'],
    timeFrom: '7:00 am',
    timeTo: '11:00 am',
    classLimit: 40,
    studentType: 'Regular',
    building: 'ARC 221',
    term: {
      academicYear: '2024-2025',
      term: 'Term 1',
      startDate: '2024-08-01',
      endDate: '2024-12-20'
    }
  },
  {
    id: '2',
    sectionName: 'BSCS 3A',
    subjectCode: 'CTWBCOML',
    subjectName: 'Web Commercialization',
    faculty: {
      id: 'f2',
      firstName: 'J.',
      lastName: 'Columna',
      department: 'College of Computer Studies'
    },
    room: {
      roomCode: 'PE Area 3',
      roomName: 'PE Area 3',
      type: 'Laboratory',
      floor: '1st Floor'
    },
    scheduleType: 'Laboratory',
    days: ['Monday'],
    timeFrom: '1:00 pm',
    timeTo: '5:00 pm',
    classLimit: 45,
    studentType: 'Regular',
    building: 'ARC 301',
    term: {
      academicYear: '2024-2025',
      term: 'Term 1',
      startDate: '2024-08-01',
      endDate: '2024-12-20'
    }
  }
];

export const mockSections = [
  { id: '1', sectionName: 'BSCS 4A', courseCode: 'BSCS', yearLevel: '4th Year' },
  { id: '2', sectionName: 'BSCS 3A', courseCode: 'BSCS', yearLevel: '3rd Year' },
  { id: '3', sectionName: 'BSCS 2A', courseCode: 'BSCS', yearLevel: '2nd Year' },
  { id: '4', sectionName: 'BSCS 1A', courseCode: 'BSCS', yearLevel: '1st Year' }
];