"use client"

import { useState, useEffect } from "react"
import useAuthStore from "@/store/useAuthStore"
import {
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    LockClosedIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    EyeSlashIcon,
} from "@heroicons/react/24/outline"
import { changePassword } from '../_actions';

export default function ManageAccount() {
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        email: ''
    })
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validatePassword = (password) => {
        const validations = {
            length: password.length >= 8,
            number: /\d/.test(password),
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const messages = [];
        if (!validations.length) messages.push("At least 8 characters");
        if (!validations.number) messages.push("At least 1 number");
        if (!validations.lowercase) messages.push("At least 1 lowercase letter");
        if (!validations.uppercase) messages.push("At least 1 uppercase letter");
        if (!validations.special) messages.push("At least 1 special character");

        return {
            isValid: Object.values(validations).every(Boolean),
            messages
        };
    };

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                middleName: user.middleName || '-',
                lastName: user.lastName || '',
                email: user.email || ''
            })
        }
    }, [user])

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData(prev => ({
            ...prev,
            [id]: value
        }))
    }

    const handlePasswordChange = (e) => {
        const { id, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [id]: value
        }));

        // Validate new password
        if (id === 'newPassword') {
            const validation = validatePassword(value);
            setPasswordErrors(prev => ({
                ...prev,
                newPassword: validation.messages.join(', ')
            }));
        }

        // Check password match
        if (id === 'confirmPassword') {
            setPasswordErrors(prev => ({
                ...prev,
                confirmPassword: value !== passwordForm.newPassword ? 'Passwords do not match' : ''
            }));
        }

        setError('');
        setSuccess('');
    };

    const handleSaveProfile = () => {
        setLoading(true)
        // TODO: Implement API call to update profile
        console.log('Updating profile with:', formData)
        setTimeout(() => {
            setLoading(false)
        }, 1000)
    }

    const handleUpdatePassword = async () => {
        setError('');
        setSuccess('');
        
        // Validate all fields
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setError('All password fields are required');
            return;
        }

        // Validate new password
        const validation = validatePassword(passwordForm.newPassword);
        if (!validation.isValid) {
            setError(`Password requirements: ${validation.messages.join(', ')}`);
            return;
        }

        // Check passwords match
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const result = await changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                email: user.email
            });
            
            if (!result.success) {
                throw new Error(result.message);
            }

            setSuccess(result.message);
            // Clear form
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderPasswordRequirements = () => (
        <div className="mt-2 text-sm text-gray-600">
            <p className="font-medium mb-1">Password requirements:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li className={passwordForm.newPassword.length >= 8 ? "text-green-600" : ""}>
                    At least 8 characters
                </li>
                <li className={/\d/.test(passwordForm.newPassword) ? "text-green-600" : ""}>
                    At least 1 number
                </li>
                <li className={/[a-z]/.test(passwordForm.newPassword) ? "text-green-600" : ""}>
                    At least 1 lowercase letter
                </li>
                <li className={/[A-Z]/.test(passwordForm.newPassword) ? "text-green-600" : ""}>
                    At least 1 uppercase letter
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? "text-green-600" : ""}>
                    At least 1 special character
                </li>
            </ul>
        </div>
    );

    return (
        <div className="space-y-8 bg">
            {/* Profile Section */}
            <div className="rounded-lg shadow-md overflow-hidden">
                <div className="bg-[#283275]/5 p-4 border-b">
                    <div className="flex items-center gap-2 text-[#283275] text-xl font-semibold">
                        <UserIcon className="h-5 w-5" />
                        Profile Information
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Update your personal information</p>
                </div>
                <div className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                First Name
                            </label>
                            <input
                                id="firstName"
                                placeholder="First Name"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                disabled
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283275] focus:border-[#283275] bg-gray-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                                Middle Name
                            </label>
                            <input
                                id="middleName"
                                placeholder="Middle Name"
                                value={formData.middleName} 
                                onChange={handleInputChange}
                                disabled
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283275] focus:border-[#283275] bg-gray-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                Last Name
                            </label>
                            <input
                                id="lastName"
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                disabled
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283275] focus:border-[#283275] bg-gray-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                                <EnvelopeIcon className="h-4 w-4" /> Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled
                                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283275] focus:border-[#283275] bg-gray-50"
                            />
                        </div>
                    </div>
                </div>
                
            </div>

            {/* Change Password Section */}
            <div className="rounded-lg shadow-md overflow-hidden">
                <div className="bg-[#283275]/5 p-4 border-b">
                    <div className="flex items-center gap-2 text-[#283275] text-xl font-semibold">
                        <LockClosedIcon className="h-5 w-5" />
                        Change Password
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Update your password to keep your account secure</p>
                </div>
                <div className="p-6 bg-white">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Current Password"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283275] focus:border-[#283275] pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283275] focus:border-[#283275] pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            {renderPasswordRequirements()}
                            {passwordErrors.newPassword && (
                                <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm New Password"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283275] focus:border-[#283275] pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            {passwordErrors.confirmPassword && (
                                <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                            )}
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm mt-2">{error}</p>
                        )}
                        {success && (
                            <p className="text-green-500 text-sm mt-2">{success}</p>
                        )}
                    </div>
                </div>
                <div className="border-t bg-slate-50 p-4 flex justify-start">
                    <button
                        onClick={handleUpdatePassword}
                        disabled={loading}
                        className={`px-4 py-2 rounded-md text-white ${loading ? "bg-[#283275]/70" : "bg-[#283275] hover:bg-[#283275]/90"
                            } transition-colors`}
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </div>
        </div>
    )
}
