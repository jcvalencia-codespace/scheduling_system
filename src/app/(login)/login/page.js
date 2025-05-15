'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { login, requestOTP, resendOTP } from '../_actions';
import useAuthStore from '@/store/useAuthStore';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formStage, setFormStage] = useState('initial'); // 'initial', 'otp'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: ''
  });
  const [resendCooldown, setResendCooldown] = useState(0);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState(''); // 'success' or 'error'
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState('idle'); // 'idle', 'verifying', 'redirecting'
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertMessage('');
    setAlertType('');

    // If in initial stage, validate email and password
    if (formStage === 'initial') {
      setVerifyLoading(true);
      if (!formData.email || !formData.password) {
        setAlertMessage('Please enter email and password');
        setAlertType('error');
        setVerifyLoading(false);
        return;
      }

      // Move to OTP stage
      try {
        const otpFormData = new FormData();
        otpFormData.append('email', formData.email);
        otpFormData.append('password', formData.password);

        const response = await requestOTP(otpFormData);

        if (response.error) {
          setAlertMessage(response.error);
          setAlertType('error');
          setVerifyLoading(false);
          return;
        }

        setFormStage('otp');
        setAlertMessage('OTP has been sent successfully. (Check your email inbox or spam folder.)');
        setAlertType('success');
      } catch (err) {
        setAlertMessage('An error occurred while requesting OTP');
        setAlertType('error');
      } finally {
        setVerifyLoading(false);
      }
      return;
    }

    // If in OTP stage, verify login with OTP
    setVerifyStatus('verifying');
    const loginFormData = new FormData();
    loginFormData.append('email', formData.email);
    loginFormData.append('password', formData.password);
    loginFormData.append('otp', formData.otp);

    try {
      const response = await login(loginFormData);

      if (response.error) {
        setAlertMessage(response.error);
        setAlertType('error');
        setVerifyStatus('idle');
        return;
      }

      if (response.success) {
        setVerifyStatus('redirecting');
        setUser(response.user);
        // Redirect faculty to faculty schedules, others to dashboard
        if (response.user.role === 'faculty' || response.user.role === 'Faculty') {
          router.push('/schedules/faculty');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setAlertMessage('An error occurred during login');
      setAlertType('error');
      setVerifyStatus('idle');
    }
  };

  const handleClear = () => {
    setFormData({
      email: '',
      password: '',
      otp: ''
    });
    setAlertMessage('');
    setAlertType('');
    setFormStage('initial');
  };

  const handleBack = () => {
    setFormData(prev => ({
      ...prev,
      otp: '' // Clear OTP
    }));
    setAlertMessage('');
    setAlertType('');
    setFormStage('initial');
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setAlertMessage('');
    setAlertType('');

    try {
      const otpFormData = new FormData();
      otpFormData.append('email', formData.email);

      const response = await resendOTP(otpFormData);

      if (response.error) {
        setAlertMessage(response.error);
        setAlertType('error');
      } else {
        // Start cooldown timer
        setResendCooldown(60);
        const cooldownInterval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setAlertMessage('OTP resent successfully');
        setAlertType('success');
      }
    } catch (err) {
      setAlertMessage('An error occurred while resending OTP');
      setAlertType('error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-r from-[#323E8F] to-[#1E2657]">
      {/* Left Column - Image */}
      <div className="hidden md:block md:w-1/2 relative flex items-center justify-center min-h-[300px] md:min-h-screen rounded-br-[80px] overflow-hidden">
        <Image
          src="https://i.imgur.com/tSaJcCx.jpeg"
          alt="NU Baliwag"
          fill
          className="object-cover rounded-br-[80px]"
          priority
        />
      </div>

      {/* Right Column - Login Form */}
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

          {alertMessage && (
            <div className={`mb-4 p-3 ${alertType === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} rounded-lg`}>
              {alertMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-md shadow-sm -space-y-px">
              {formStage === 'initial' && (
                <>
                  <div>
                    <label className="flex items-center text-gray-700 text-sm font-medium mb-2">
                      <span className="mr-2">Email</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#323E8F] text-black placeholder-gray-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-gray-700 text-sm font-medium mb-2 mt-4">
                      <span className="mr-2">Password</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#323E8F] text-black placeholder-gray-500"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {formStage === 'otp' && (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-gray-700 text-sm font-medium mb-2">
                      <span className="mr-2">OTP Code</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-4 w-4" fill="currentColor">
                        <path d="M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17l0 80c0 13.3 10.7 24 24 24l80 0c13.3 0 24-10.7 24-24l0-40 40 0c13.3 0 24-10.7 24-24l0-40 40 0c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z" />
                      </svg>
                    </label>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#323E8F] text-black placeholder-gray-500"
                      placeholder="Enter 6-digit OTP"
                    />
                  </div>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex justify-between space-x-4 w-full max-w-xs">
                      <button
                        type="submit"
                        className="w-1/2 bg-[#00204A] text-white py-2 px-4 rounded-md hover:bg-[#002b63] transition-colors disabled:opacity-50"
                        disabled={verifyLoading || verifyStatus !== 'idle'}
                      >
                        {verifyStatus === 'verifying' ? 'Verifying...' :
                          verifyStatus === 'redirecting' ? 'Redirecting...' :
                            verifyLoading ? 'Processing...' : 'Verify OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        className={`w-1/2 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors ${resendCooldown > 0 || resendLoading ? 'disabled:opacity-50' : ''}`}
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendLoading ? 'Resending...' : 'Resend OTP'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full max-w-xs bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {formStage === 'initial' ? (
                <>
                  <button
                    type="submit"
                    className="w-full bg-[#00204A] text-white py-2 px-4 rounded-md hover:bg-[#002b63] transition-colors disabled:opacity-50"
                  >
                    {verifyLoading ? 'Processing...' : 'Login'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <></>
              )}
            </div>
          </form>
          <div className="text-right mt-2">
            <Link href="/forgot-password" className="text-blue-500 hover:text-blue-600 text-sm">
              Forgot Password?
            </Link>
          </div>
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