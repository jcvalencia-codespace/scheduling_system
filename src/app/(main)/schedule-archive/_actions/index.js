'use server'

import TermsModel from '@/app/models/Terms'
import schedulesModel from '@/app/models/Schedules'
import sectionsModel from '@/app/models/Sections'

export async function getArchivedSchedules(year, termId) {
  try {
    console.log('🔍 Action: getArchivedSchedules - Start', { year, termId })
    const schedules = await schedulesModel.getSchedulesByYearAndTerm(year, termId)
    console.log('📊 Action: Schedules fetched successfully:', {
      count: schedules?.length || 0,
      firstSchedule: schedules?.[0] ? {
        section: schedules[0].section?.sectionName,
        subject: schedules[0].subject?.subjectCode
      } : null
    })
    return { schedules: JSON.parse(JSON.stringify(schedules)) }
  } catch (error) {
    console.error('❌ Action: Error fetching archived schedules:', error)
    return { error: error.message }
  }
}

export async function getArchivedTerms() {
  try {
    console.log('🔍 Action: Getting archived terms')
    const terms = await TermsModel.getAllArchivedTerms()
    
    console.log('✅ Action: Archived terms fetched:', {
      years: Object.keys(terms).length,
      totalTerms: Object.values(terms).flat().length
    })

    return { terms }
  } catch (error) {
    console.error('❌ Action: Error fetching archived terms:', error)
    return { error: error.message }
  }
}

export async function getArchiveFormData(userRole, departmentId, courseId) {
  try {
    console.log('🔍 Action: Getting form data with params:', {
      userRole: userRole || 'none',
      departmentId: departmentId?.toString() || 'none',
      courseId: courseId?.toString() || 'none'
    })

    if (!userRole) {
      console.log('⚠️ Action: No user role provided, returning empty sections')
      return { sections: [] }
    }

    const sections = await sectionsModel.getAllSectionsWithDepartment(
      userRole,
      departmentId?.toString(),
      courseId?.toString()
    )
    
    console.log('✅ Action: Sections fetched:', sections?.length || 0)
    return {
      sections: JSON.parse(JSON.stringify(sections || []))
    }
  } catch (error) {
    console.error('❌ Action: Error fetching archive form data:', error)
    throw error
  }
}

export async function getFaculty() {
  try {
    const faculty = await Users.aggregate([
      {
        $match: {
          role: { $in: ['Faculty', 'Program Chair', 'Dean'] }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      { $unwind: '$departmentInfo' },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          department: '$departmentInfo.departmentCode',
          role: 1
        }
      },
      { $sort: { lastName: 1, firstName: 1 } }
    ])
    
    return JSON.parse(JSON.stringify(faculty))
  } catch (error) {
    console.error('Error fetching faculty:', error)
    throw error
  }
}

export async function getFacultyArchive() {
  try {
    console.log('🔍 Action: Getting faculty archive data')
    const Users = (await import('@/app/models/Users')).default
    
    const faculty = await Users.getFacultyUsers()
    console.log('✅ Action: Faculty fetched:', faculty.length)
    
    return { faculty: JSON.parse(JSON.stringify(faculty[0].faculty || [])) }
  } catch (error) {
    console.error('❌ Action: Error fetching faculty:', error)
    throw error
  }
}

export async function getRooms() {
  try {
    console.log('🔍 Action: Getting rooms data')
    const Rooms = (await import('@/app/models/Rooms')).default
    
    const rooms = await Rooms.getAllActiveRooms()
    console.log('✅ Action: Rooms fetched:', rooms?.length || 0)
    
    return { rooms: JSON.parse(JSON.stringify(rooms)) }
  } catch (error) {
    console.error('❌ Action: Error fetching rooms:', error)
    return { error: error.message }
  }
}
