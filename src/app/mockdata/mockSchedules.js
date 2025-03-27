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
    timeTo: '11:20 am',
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
  },
  {
    id: '3',
    sectionName: 'BSCS 2A',
    subjectCode: 'PROG101',
    subjectName: 'Introduction to Programming',
    faculty: {
      id: 'f3',
      firstName: 'A.',
      lastName: 'Villanueva',
      department: 'College of Computer Studies'
    },
    room: {
      roomCode: 'Lab 2',
      roomName: 'Laboratory 2',
      type: 'Laboratory',
      floor: '2nd Floor'
    },
    scheduleType: 'Laboratory',
    days: ['Friday'],
    timeFrom: '9:00 am',
    timeTo: '12:00 pm',
    classLimit: 30,
    studentType: 'Regular',
    building: 'Main Building',
    term: {
      academicYear: '2024-2025',
      term: 'Term 1',
      startDate: '2024-08-01',
      endDate: '2024-12-20'
    }
  },
  {
    id: '4',
    sectionName: 'BSCS 1A',
    subjectCode: 'MATH101',
    subjectName: 'Basic Mathematics',
    faculty: {
      id: 'f4',
      firstName: 'R.',
      lastName: 'Santos',
      department: 'College of Computer Studies'
    },
    room: {
      roomCode: 'R101',
      roomName: 'Room 101',
      type: 'Lecture',
      floor: '1st Floor'
    },
    scheduleType: 'Lecture',
    days: ['Tuesday', 'Thursday'],
    timeFrom: '10:00 am',
    timeTo: '11:20 am',
    classLimit: 35,
    studentType: 'Regular',
    building: 'North Wing',
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
