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
    const room = new Room(roomData);
    const savedRoom = await room.save();
    return JSON.parse(JSON.stringify(savedRoom));
  }

  async getAllRooms() {
    const Room = await this.initModel();
    const rooms = await Room.find({ isActive: true });
    return JSON.parse(JSON.stringify(rooms));
  }

  async getRoomByCode(roomCode) {
    const Room = await this.initModel();
    const room = await Room.findOne({ roomCode, isActive: true });
    return room ? JSON.parse(JSON.stringify(room)) : null;
  }

  async updateRoom(roomCode, updateData) {
    const Room = await this.initModel();
    const room = await Room.findOneAndUpdate(
      { roomCode, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    return room ? JSON.parse(JSON.stringify(room)) : null;
  }

  async deleteRoom(roomCode) {
    const Room = await this.initModel();
    const room = await Room.findOneAndUpdate(
      { roomCode, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );
    return room ? JSON.parse(JSON.stringify(room)) : null;
  }

  async getRoomsByDepartment(departmentCode) {
    const Room = await this.initModel();
    const rooms = await Room.find({ departmentCode, isActive: true });
    return JSON.parse(JSON.stringify(rooms));
  }
}

const roomsModel = new RoomsModel();
export default roomsModel;
