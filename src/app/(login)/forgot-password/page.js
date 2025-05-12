'use client';

import { useState } from 'react';
import { requestPasswordReset, verifyOTP, verifyOTPAndResetPassword } from '../_actions';
import {
  ArrowLeftIcon, 
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formStage, setFormStage] = useState('email'); // email, otp, password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (formStage === 'email') {
        // Request password reset OTP
        const formDataObj = new FormData();
        formDataObj.append('email', formData.email);

        const result = await requestPasswordReset(formDataObj);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess('OTP has been sent successfully. (Check your email inbox or spam folder.)');
          setFormStage('otp');
        }
      } else if (formStage === 'otp') {
        // Verify OTP only first
        const formDataObj = new FormData();
        formDataObj.append('email', formData.email);
        formDataObj.append('otp', formData.otp);

        const result = await verifyOTP(formData.email, formData.otp);
        if (result.error) {
          setError(result.error);
          return; // Add this to prevent proceeding if OTP is invalid
        } else {
          setSuccess('OTP verified successfully');
          setFormStage('password');
        }
      } else if (formStage === 'password') {
        // Validate passwords match
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        // Reset password with verified OTP
        const formDataObj = new FormData();
        formDataObj.append('email', formData.email);
        formDataObj.append('otp', formData.otp);
        formDataObj.append('newPassword', formData.newPassword);

        const result = await verifyOTPAndResetPassword(formDataObj);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess('Password has been reset successfully');
          // Redirect to login page after 2 seconds
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-r from-[#323E8F] to-[#1E2657]">
      {/* Left Column - Background Image */}
      <div className="hidden md:block md:w-1/2 relative flex items-center justify-center min-h-[300px] md:min-h-screen rounded-br-[80px] overflow-hidden">
       {/* banner-image */}
        <Image
          src="https://i.imgur.com/tSaJcCx.jpeg"
          alt="NU Baliwag"
          fill
          className="object-cover rounded-br-[80px]"
          priority
        />
      </div>

      {/* Right Column - Forgot Password Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 min-h-screen">
        <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl">
          {/* Header with logo and text */}
          <div className="flex items-center gap-4 mb-8">
            <Image
              src="https://i.imgur.com/jYFYI4l.png"
              alt="NU Shield"
              width={100}
              height={100}
              className="flex-shrink-0"
            />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-[#323E8F] mb-1 font-poppins">SCHED-NU</h1>
              <p className="text-gray-800">National University Baliwag</p>
              <p className="text-gray-800">Scheduling System</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg relative">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {formStage === 'email' && (
              <div>
                <label className="flex items-center text-gray-700 text-sm font-medium mb-2">
                  <span className="mr-2">Enter Email</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#323E8F] text-black placeholder-gray-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            )}

            {formStage === 'otp' && (
              <div>
                <label className="flex items-center text-gray-700 text-sm font-medium mb-2">
                  <span className="mr-2">OTP Code</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-4 w-4" fill="currentColor">
                    <path d="M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17l0 80c0 13.3 10.7 24 24 24l80 0c13.3 0 24-10.7 24-24l0-40 40 0c13.3 0 24-10.7 24-24l0-40 40 0c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z"/>
                  </svg>
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    value={formData.otp}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#323E8F] focus:border-[#323E8F] sm:text-sm text-black"
                    placeholder="Enter the 6-digit code"
                  />
                </div>
              </div>
            )}

            {formStage === 'password' && (
              <>
                <div>
                  <label className="flex items-center text-gray-700 text-sm font-medium mb-2">
                    <span className="mr-2">New Password</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#323E8F] focus:border-[#323E8F] sm:text-sm text-black"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-gray-700 text-sm font-medium mb-2">
                    <span className="mr-2">Confirm Password</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#323E8F] focus:border-[#323E8F] sm:text-sm text-black"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00204A] text-white py-2 px-4 rounded-md hover:bg-[#002b63] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : formStage === 'email' ? (
                  'Send Reset Code'
                ) : formStage === 'otp' ? (
                  'Verify OTP'
                ) : (
                  'Reset Password'
                )}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </form>

          <div className="mt-4 text-center text-xs text-gray-500">
            <div className="text-align max-w-sm mx-auto">
              <p>All rights reserved. The trademarks and logos of National University® are used with permission from National University Inc. for educational purposes only. Unauthorized use is strictly prohibited.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
