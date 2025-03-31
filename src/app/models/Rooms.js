import { RoomSchema } from '../../../db/schema';
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

  async createRoom(roomData) {
    const Room = await this.initModel();
    const room = new Room({
      ...roomData,
      updateHistory: [{
        updatedBy: roomData.updatedBy,
        updatedAt: new Date(),
        action: 'created'
      }]
    });
    const savedRoom = await room.save();
    await savedRoom.populate('department', 'departmentCode departmentName');
    return JSON.parse(JSON.stringify(savedRoom));
  }

  async processRoomCreation(roomData) {
    // Check for existing active room
    const existingActive = await this.getRoomByCode(roomData.roomCode);
    if (existingActive) {
      throw new Error('Room code already exists');
    }

    // Check for inactive room
    const existingInactive = await this.getInactiveRoomByCode(roomData.roomCode);
    if (existingInactive) {
      return await this.reactivateRoom(roomData.roomCode, roomData.userId);
    }

    return await this.createRoom(roomData);
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
    const Rooms = await this.initModel();
    const rooms = await Rooms.find({ isActive: true })
      .sort({ roomCode: 1 })
      .populate('department', 'departmentCode departmentName');
    return JSON.parse(JSON.stringify(rooms));
  }

  async getRoomByCode(roomCode) {
    const Room = await this.initModel();
    const room = await Room.findOne({ roomCode, isActive: true })
      .populate('department', 'departmentCode departmentName');
    return room ? JSON.parse(JSON.stringify(room)) : null;
  }

  async updateRoom(roomCode, updateData) {
    const Room = await this.initModel();
    const { updatedBy, ...otherData } = updateData;
    
    const room = await Room.findOneAndUpdate(
      { roomCode, isActive: true },
      {
        $set: otherData,
        $push: {
          updateHistory: {
            updatedBy,
            updatedAt: new Date(),
            action: 'updated'
          }
        }
      },
      { new: true, runValidators: true }
    ).populate('department', 'departmentCode departmentName');
    
    return room ? JSON.parse(JSON.stringify(room)) : null;
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
    const room = await Room.findOneAndUpdate(
      { roomCode, isActive: true },
      {
        $set: { isActive: false },
        $push: {
          updateHistory: {
            updatedBy: userId,
            action: 'deleted'
          }
        }
      },
      { new: true }
    );
    return room ? JSON.parse(JSON.stringify(room)) : null;
  }

  async processRoomDeletion(roomCode, userId) {
    if (!roomCode) {
      throw new Error('Room code is required');
    }

    const deletedRoom = await this.deleteRoom(roomCode, userId);
    if (!deletedRoom) {
      throw new Error('Failed to delete room');
    }
    return deletedRoom;
  }

  async getRoomsByDepartment(departmentCode) {
    const Room = await this.initModel();
    const rooms = await Room.find({ departmentCode, isActive: true });
    return JSON.parse(JSON.stringify(rooms));
  }
}

const roomsModel = new RoomsModel();
export default roomsModel;
