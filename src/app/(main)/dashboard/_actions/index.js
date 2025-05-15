'use server'

import roomsModel from "@/app/models/Rooms"
import { Schedules } from "@/app/models"
import termsModel from "@/app/models/Terms"
import subjectsModel from "@/app/models/Subjects"
import usersModel from "@/app/models/Users"
import sectionsModel from "@/app/models/Sections"

export async function getRoomStatistics() {
  try {
    const rooms = await roomsModel.getAllActiveRooms()
    
    // Group rooms by department code
    const roomsByDepartment = rooms.reduce((acc, room) => {
      const deptCode = room.department ? room.department.departmentCode : 'N/A'
      acc[deptCode] = (acc[deptCode] || 0) + 1
      return acc
    }, {})

    // Get all active schedules
    const schedules = await Schedules.find({ isActive: true })
      .populate('scheduleSlots.room')
      .lean()

    // Calculate number of schedules per room
    const allRooms = new Map()
    
    // Initialize all rooms with zero count
    rooms.forEach(room => {
      allRooms.set(room.roomCode, {
        roomCode: room.roomCode,
        scheduledCount: 0
      })
    })

    // Count schedules for each room
    schedules.forEach(schedule => {
      schedule.scheduleSlots.forEach(slot => {
        if (slot.room?.roomCode) {
          const roomData = allRooms.get(slot.room.roomCode)
          if (roomData) {
            roomData.scheduledCount++
          }
        }
      })
    })

    // Convert to array and sort
    const sortedRooms = Array.from(allRooms.values())
      .sort((a, b) => b.scheduledCount - a.scheduledCount)
    
    // Get top 5 most and least scheduled rooms
    const mostScheduled = sortedRooms.slice(0, 5)
    const leastScheduled = sortedRooms
      .filter(room => room.scheduledCount === 0)
      .slice(0, 5)

    // Format for chart display
    const usageFrequency = mostScheduled.map(room => ({
      roomCode: room.roomCode,
      mostScheduled: room.scheduledCount,
      leastScheduled: 0
    }))

    return {
      registeredRooms: Object.entries(roomsByDepartment)
        .map(([department, count]) => ({
          department,
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      usageFrequency
    }
  } catch (error) {
    console.error('Error fetching room statistics:', error)
    throw new Error('Failed to fetch room statistics')
  }
}

export async function getDashboardStats() {
  try {
    // Initialize all models first
    await subjectsModel.initModel()
    await usersModel.initModel()
    
    // Get active term
    const activeTerm = await termsModel.getActiveTerm()
    
    // Get schedules count for active term
    const schedules = activeTerm ? await Schedules.countDocuments({ 
      isActive: true,
      term: activeTerm.id 
    }) : 0

    // Get subjects count after model initialization
    const subjects = await subjectsModel.MODEL.countDocuments({ isActive: true })

    // Get faculty count after model initialization
    const faculty = await usersModel.MODEL.countDocuments({ 
      role: { $in: ['Faculty', 'Program Chair', 'Dean'] }
    })

    return {
      term: activeTerm ? activeTerm.term : 'No Active Term',
      schedules,
      subjects,
      faculty
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw new Error('Failed to fetch dashboard statistics')
  }
}

export async function getRecentActivities() {
  try {
    // Initialize models
    await subjectsModel.initModel()
    await roomsModel.initModel()
    await usersModel.initModel()

    // Get recent update histories from different models with proper population
    const [subjects, rooms, users] = await Promise.all([
      subjectsModel.MODEL.aggregate([
        { $match: { updateHistory: { $exists: true, $ne: [] } } },
        { $unwind: '$updateHistory' },
        {
          $lookup: {
            from: 'users',
            localField: 'updateHistory.updatedBy',
            foreignField: '_id',
            as: 'updateHistory.user'
          }
        },
        { $unwind: { path: '$updateHistory.user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            subjectCode: 1,
            'updateHistory': {
              _id: '$updateHistory._id',
              action: '$updateHistory.action',
              updatedAt: '$updateHistory.updatedAt',
              updatedBy: {
                firstName: '$updateHistory.user.firstName',
                lastName: '$updateHistory.user.lastName'
              }
            }
          }
        }
      ]),
      roomsModel.MODEL.aggregate([
        { $match: { updateHistory: { $exists: true, $ne: [] } } },
        { $unwind: '$updateHistory' },
        {
          $lookup: {
            from: 'users',
            localField: 'updateHistory.updatedBy',
            foreignField: '_id',
            as: 'updateHistory.user'
          }
        },
        { $unwind: { path: '$updateHistory.user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            roomCode: 1,
            'updateHistory': {
              _id: '$updateHistory._id',
              action: '$updateHistory.action',
              updatedAt: '$updateHistory.updatedAt',
              updatedBy: {
                firstName: '$updateHistory.user.firstName',
                lastName: '$updateHistory.user.lastName'
              }
            }
          }
        }
      ]),
      usersModel.MODEL.aggregate([
        { $match: { updateHistory: { $exists: true, $ne: [] } } },
        { $unwind: '$updateHistory' },
        {
          $lookup: {
            from: 'users',
            localField: 'updateHistory.updatedBy',
            foreignField: '_id',
            as: 'updateHistory.user'
          }
        },
        { $unwind: { path: '$updateHistory.user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            'updateHistory': {
              _id: '$updateHistory._id',
              action: '$updateHistory.action',
              updatedAt: '$updateHistory.updatedAt',
              updatedBy: {
                firstName: '$updateHistory.user.firstName',
                lastName: '$updateHistory.user.lastName'
              }
            }
          }
        }
      ])
    ])

    // Combine and format all activities
    const activities = []

    // Format subject activities
    subjects.forEach(subject => {
      activities.push({
        id: subject.updateHistory._id.toString(),
        action: `${subject.updateHistory.action} subject ${subject.subjectCode}`,
        user: subject.updateHistory.updatedBy 
          ? `${subject.updateHistory.updatedBy.firstName} ${subject.updateHistory.updatedBy.lastName}`
          : 'System',
        time: subject.updateHistory.updatedAt,
        status: getStatusFromAction(subject.updateHistory.action)
      })
    })

    // Format room activities
    rooms.forEach(room => {
      activities.push({
        id: room.updateHistory._id.toString(),
        action: `${room.updateHistory.action} room ${room.roomCode}`,
        user: room.updateHistory.updatedBy
          ? `${room.updateHistory.updatedBy.firstName} ${room.updateHistory.updatedBy.lastName}`
          : 'System',
        time: room.updateHistory.updatedAt,
        status: getStatusFromAction(room.updateHistory.action)
      })
    })

    // Format user activities
    users.forEach(user => {
      activities.push({
        id: user.updateHistory._id.toString(),
        action: `${user.updateHistory.action} user ${user.firstName} ${user.lastName}`,
        user: user.updateHistory.updatedBy
          ? `${user.updateHistory.updatedBy.firstName} ${user.updateHistory.updatedBy.lastName}`
          : 'System',
        time: user.updateHistory.updatedAt,
        status: getStatusFromAction(user.updateHistory.action)
      })
    })

    // Sort by date and get most recent 7
    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 7)
      .map(activity => ({
        ...activity,
        time: formatTimeAgo(activity.time)
      }))

  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return []
  }
}

export async function getUnscheduledSections(userRole, userData) {
  try {
    const activeTerm = await termsModel.getActiveTerm()
    if (!activeTerm) return []

    // Get all sections first
    const sections = await sectionsModel.getAllSectionsWithDepartment()
    const serializedSections = JSON.parse(JSON.stringify(sections))
    
    // Filter sections based on user role
    let filteredSections = serializedSections
    if (userRole === 'Program Chair' && userData?.course) {
      filteredSections = serializedSections.filter(section => 
        section.course?._id.toString() === userData.course.toString()
      )
    } else if (userRole === 'Dean' && userData?.department) {
      filteredSections = serializedSections.filter(section => 
        section.department?._id.toString() === userData.department.toString()
      )
    }

    // Get schedules and filter unscheduled sections
    const schedules = await Schedules.find({ 
      isActive: true,
      term: activeTerm.id
    }).select('section').lean()
    
    const scheduledSectionIds = schedules.reduce((acc, schedule) => {
      if (Array.isArray(schedule.section)) {
        acc.push(...schedule.section)
      } else {
        acc.push(schedule.section)
      }
      return acc
    }, []).map(id => id.toString())

    const unscheduledSections = filteredSections.filter(
      section => !scheduledSectionIds.includes(section._id.toString())
    )

    return unscheduledSections.map(section => ({
      id: section._id.toString(),
      code: `${section.course?.courseCode || 'N/A'} - ${section.sectionName}`,
      yearLevel: section.yearLevel
    }))

  } catch (error) {
    console.error('Error fetching unscheduled sections:', error)
    return []
  }
}

function getStatusFromAction(action) {
  if (action.includes('created')) return 'success'
  if (action.includes('deleted')) return 'error'
  if (action.includes('updated')) return 'warning'
  return 'success'
}

function formatTimeAgo(date) {
  const now = new Date()
  const diff = now - new Date(date)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return 'Just now'
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  return `${Math.floor(hours / 24)} days ago`
}
