'use server'

import UsersModel from '@/app/models/Users';
import AccessSettings from '@/app/models/AccessSettings';

export async function changePassword(formData) {
    try {
        const { currentPassword, newPassword, email } = formData;
        
        if (!email || !currentPassword || !newPassword) {
            throw new Error('Missing required fields');
        }

        const user = await UsersModel.getUserByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        const isValid = await UsersModel.validatePassword(user, currentPassword);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        // Only update the password field
        await UsersModel.updateUser(user._id, { password: newPassword });
        return { success: true, message: 'Password updated successfully' };
    } catch (error) {
        console.error('Password change error:', error);
        return { success: false, message: error.message };
    }
}

export async function saveAccessSettings(role, settings) {
    try {
        const settingsToSave = {
            showMultipleSections: settings.showMultipleSections,
            showFacultyDropdown: settings.showFacultyDropdown
        };

        const result = await AccessSettings.findOneAndUpdate(
            { role },
            {
                $set: { settings: settingsToSave },
                $push: {
                    updateHistory: {
                        updatedBy: settings.userId,
                        updatedAt: new Date()
                    }
                }
            },
            { upsert: true, new: true }
        );
        
        // Serialize the data before returning
        return { 
            success: true, 
            data: JSON.parse(JSON.stringify(result.settings))
        };
    } catch (error) {
        console.error('Error saving access settings:', error);
        return { success: false, error: error.message };
    }
}

export async function getAccessSettings(role) {
    try {
        const settings = await AccessSettings.findOne({ role });
        // Serialize the data before returning
        return { 
            success: true, 
            data: settings?.settings ? 
                JSON.parse(JSON.stringify(settings.settings)) : 
                { showMultipleSections: true, showFacultyDropdown: true } 
        };
    } catch (error) {
        console.error('Error getting access settings:', error);
        return { success: false, error: error.message };
    }
}