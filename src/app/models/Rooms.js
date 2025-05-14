import { RoomSchema, TermSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class RoomsModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.Rooms || mongoose.model("Rooms", RoomSchema);
    }
    return this.MODEL;
  }

  async validateRoomData(roomData) {
    // Get active term
    const Term = mongoose.models.Term || mongoose.model('Term', TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }
    roomData.academicYear = activeTerm.academicYear;

    // Continue with existing validation
  }

  toPlainObject(doc) {
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc));
  }

  async createRoom(roomData) {
    const Room = await this.initModel();
    
    // Get active term
    const Term = mongoose.models.Term || mongoose.model('Term', TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }

    roomData.academicYear = activeTerm.academicYear;

    // Find the most recent room with this code
    const existingRoom = await Room.findOne({ 
      roomCode: roomData.roomCode,
      isActive: false
    }).sort({ createdAt: -1 });

    // Add timestamps to updateHistory
    if (!roomData.updateHistory) {
      roomData.updateHistory = [];
    }
    roomData.updateHistory.push({
      updatedBy: roomData.updatedBy,
      action: 'created',
      updatedAt: new Date(),
      academicYear: activeTerm.academicYear
    });

    // If there's an inactive room, reactivate it instead of creating a new one
    if (existingRoom) {
      existingRoom.isActive = true;
      existingRoom.roomName = roomData.roomName;
      existingRoom.type = roomData.type;
      existingRoom.floor = roomData.floor;
      existingRoom.department = roomData.department;
      existingRoom.capacity = roomData.capacity;
      existingRoom.updateHistory.push({
        updatedBy: roomData.updatedBy,
        action: 'reactivated',
        updatedAt: new Date(),
        academicYear: activeTerm.academicYear
      });
      await existingRoom.save();
      const populatedRoom = await Room.findById(existingRoom._id)
        .populate('department', 'departmentCode departmentName');
      return this.toPlainObject(populatedRoom);
    }

    const savedRoom = await Room.create(roomData);
    const populatedRoom = await Room.findById(savedRoom._id)
      .populate('department', 'departmentCode departmentName');
    
    return this.toPlainObject(populatedRoom);
  }

  async getInactiveRoomByCode(roomCode) {
    const Room = await this.initModel();
    const room = await Room.findOne({ 
      roomCode, 
      isActive: false 
    });
    return room ? JSON.parse(JSON.stringify(room)) : null;
  }

  async reactivateRoom(roomCode, userId) {
    const Room = await this.initModel();
    const room = await Room.findOneAndUpdate(
      { roomCode, isActive: false },
      { 
        isActive: true,
        $push: {
          updateHistory: {
            updatedBy: userId,
            action: 'updated'
          }
        }
      },
      { new: true }
    ).populate('department', 'departmentCode departmentName');
    
    return room ? JSON.parse(JSON.stringify(room)) : null;
  }

  async getAllRooms() {
    try {
      const Room = await this.initModel();
      const rooms = await Room.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'department',
            foreignField: '_id',
            as: 'departmentInfo'
          }
        },
        { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            'department': {
              $cond: {
                if: { $ifNull: ['$departmentInfo', false] },
                then: {
                  _id: { $toString: '$departmentInfo._id' },
                  departmentCode: '$departmentInfo.departmentCode',
                  departmentName: '$departmentInfo.departmentName'
                },
                else: null
              }
            },
            '_id': { $toString: '$_id' },
            'updateHistory': {
              $map: {
                input: '$updateHistory',
                as: 'history',
                in: {
                  _id: { $toString: '$$history._id' },
                  updatedBy: { $toString: '$$history.updatedBy' },
                  updatedAt: { $dateToString: { date: '$$history.updatedAt', format: '%Y-%m-%dT%H:%M:%S.%LZ' } },
                  action: '$$history.action',
                  academicYear: '$$history.academicYear'
                }
              }
            },
            'createdAt': { $dateToString: { date: '$createdAt', format: '%Y-%m-%dT%H:%M:%S.%LZ' } },
            'updatedAt': { $dateToString: { date: '$updatedAt', format: '%Y-%m-%dT%H:%M:%S.%LZ' } }
          }
        }
      ]);
      
      return JSON.parse(JSON.stringify(rooms));
    } catch (error) {
      console.error('Error in getAllRooms:', error);
      throw error;
    }
  }

  async getRoomByCode(roomCode) {
    const Room = await this.initModel();
    const room = await Room.findOne({ roomCode, isActive: true })
      .populate('department', 'departmentCode departmentName')
      .populate('updateHistory.updatedBy', 'firstName lastName');
    return this.toPlainObject(room);
  }

  async updateRoom(roomCode, updateData) {
    const Room = await this.initModel();
    
    // Check if trying to change roomCode and if new code already exists among active rooms
    const newRoomCode = updateData.roomCode?.trim().toUpperCase();
    if (newRoomCode && newRoomCode !== roomCode) {
      const existingRoom = await Room.findOne({ 
        roomCode: newRoomCode,
        isActive: true
      });
      if (existingRoom) {
        throw new Error('Room code already exists');
      }
    }

    // Handle both FormData and regular objects
    let updateHistory;
    let plainUpdateData = {};

    if (updateData instanceof FormData) {
      updateHistory = JSON.parse(updateData.get('$push[updateHistory]'));
      updateData.forEach((value, key) => {
        if (key !== 'userId' && key !== '$push[updateHistory]') {
          plainUpdateData[key] = value;
        }
      });
    } else {
      if (updateData.$push?.updateHistory) {
        updateHistory = updateData.$push.updateHistory;
        delete updateData.$push;
      }
      plainUpdateData = { ...updateData };
    }

    const room = await Room.findOneAndUpdate(
      { roomCode },
      {
        $set: plainUpdateData,
        $push: {
          updateHistory: {
            updatedBy: updateData.updatedBy,
            action: 'updated',
            updatedAt: new Date(),
            academicYear: new Date().getFullYear()
          }
        }
      },
      { new: true, runValidators: true }
    )
    .populate('department', 'departmentCode departmentName');
    
    if (!room) {
      throw new Error('Room not found');
    }

    return this.toPlainObject(room);
  }

  async processRoomUpdate(roomCode, updateData) {
    const updatedRoom = await this.updateRoom(roomCode, updateData);
    if (!updatedRoom) {
      throw new Error('Room not found');
    }
    return updatedRoom;
  }

  async deleteRoom(roomCode, userId) {
    const Room = await this.initModel();
    
    // Get active term for academic year
    const Term = mongoose.models.Term || mongoose.model('Term', TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }

    const room = await Room.findOneAndUpdate(
      { roomCode, isActive: true },
      { 
        isActive: false,
        $push: {
          updateHistory: {
            updatedBy: userId,
            action: 'deleted',
            updatedAt: new Date(),
            academicYear: activeTerm.academicYear
          }
        }
      },
      { new: true }
    );
    
    if (!room) {
      throw new Error('Room not found');
    }

    return this.toPlainObject(room);
  }

  async processRoomDeletion(roomCode, userId) {
    // Get active term
    const Term = mongoose.models.Term || mongoose.model('Term', TermSchema);
    const activeTerm = await Term.findOne({ status: 'Active' });
    if (!activeTerm) {
      throw new Error('No active term found');
    }

    const updateData = {
      updatedBy: userId,
      $push: {
        updateHistory: {
          updatedBy: userId,
          updatedAt: new Date(),
          action: 'deleted',
          academicYear: activeTerm.academicYear
        }
      }
    };

    const deletedRoom = await this.deleteRoom(roomCode, userId);
    if (!deletedRoom) {
      throw new Error('Failed to delete room');
    }
    return deletedRoom;
  }

  async getRoomsByDepartment(departmentId = null) {
    try {
      const Room = await this.initModel();
      const query = { 
        isActive: true,
        $or: [
          { department: departmentId ? new mongoose.Types.ObjectId(departmentId) : null },
          { department: { $exists: false } },
          { department: null }
        ]
      };

      const rooms = await Room.find(query)
        .populate({
          path: 'department',
          select: 'departmentCode departmentName',
          model: 'Departments'
        })
        .sort({ roomCode: 1 });
      
      // Convert to plain objects with proper date handling
      const plainRooms = rooms.map(room => {
        const plainRoom = room.toObject();
        if (plainRoom.updateHistory) {
          plainRoom.updateHistory = plainRoom.updateHistory.map(history => ({
            ...history,
            updatedAt: history.updatedAt instanceof Date ? history.updatedAt : new Date(history.updatedAt)
          }));
        }
        return plainRoom;
      });

      console.log(`Found ${rooms.length} rooms for department ${departmentId}`);
      return plainRooms;
    } catch (error) {
      console.error('Error in getRoomsByDepartment:', error);
      throw error;
    }
  }

  async getAllActiveRooms() {
    try {
      const Room = await this.initModel();
      const rooms = await Room.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'department',
            foreignField: '_id',
            as: 'departmentInfo'
          }
        },
        { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            roomCode: 1,
            roomName: 1,
            capacity: 1,
            type: 1,
            floor: 1,
            department: {
              $cond: {
                if: { $ifNull: ['$departmentInfo', false] },
                then: {
                  _id: '$departmentInfo._id',
                  departmentCode: '$departmentInfo.departmentCode',
                  departmentName: '$departmentInfo.departmentName'
                },
                else: null
              }
            }
          }
        },
        { $sort: { roomCode: 1 } }
      ]);

      return JSON.parse(JSON.stringify(rooms));
    } catch (error) {
      console.error('Error in getAllActiveRooms:', error);
      throw error;
    }
  }

  static async getRooms() {
    try {
      const rooms = await Rooms.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'department',
            foreignField: '_id',
            as: 'departmentInfo'
          }
        },
        { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: { $toString: '$_id' },
            roomCode: 1,
            roomName: 1,
            capacity: 1,
            type: 1,
            floor: 1,
            department: {
              $cond: {
                if: { $ifNull: ['$departmentInfo', false] },
                then: {
                  _id: { $toString: '$departmentInfo._id' },
                  departmentCode: '$departmentInfo.departmentCode',
                  departmentName: '$departmentInfo.departmentName'
                },
                else: null
              }
            },
            updateHistory: {
              $map: {
                input: '$updateHistory',
                as: 'history',
                in: {
                  _id: { $toString: '$$history._id' },
                  updatedBy: { $toString: '$$history.updatedBy' },
                  updatedAt: '$$history.updatedAt',
                  action: '$$history.action',
                  academicYear: '$$history.academicYear'
                }
              }
            },
            createdAt: 1,
            updatedAt: 1
          }
        },
        { $sort: { roomCode: 1 } }
      ]);

      // Parse dates and ensure all objects are plain
      const serializedRooms = rooms.map(room => ({
        ...room,
        createdAt: room.createdAt?.toISOString(),
        updatedAt: room.updatedAt?.toISOString(),
        updateHistory: room.updateHistory?.map(history => ({
          ...history,
          updatedAt: history.updatedAt?.toISOString()
        }))
      }));

      return serializedRooms;
    } catch (error) {
      console.error('Rooms fetch error:', error);
      throw new Error('Failed to fetch rooms');
    }
  }
}

const roomsModel = new RoomsModel();
export default roomsModel;
