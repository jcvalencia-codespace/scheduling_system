'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { login, requestOTP } from '../_actions';
import useAuthStore from '@/store/useAuthStore';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // If in initial stage, validate email and password
    if (formStage === 'initial') {
      if (!formData.email || !formData.password) {
        setError('Please enter email and password');
        setLoading(false);
        return;
      }
      
      // Move to OTP stage
      try {
        const otpFormData = new FormData();
        otpFormData.append('email', formData.email);
        otpFormData.append('password', formData.password);
        
        const response = await requestOTP(otpFormData);
        
        if (response.error) {
          setError(response.error);
          return;
        }

        setFormStage('otp');
      } catch (err) {
        setError('An error occurred while requesting OTP');
      } finally {
        setLoading(false);
      }
      return;
    }

    // If in OTP stage, verify login with OTP
    const loginFormData = new FormData();
    loginFormData.append('email', formData.email);
    loginFormData.append('password', formData.password);
    loginFormData.append('otp', formData.otp);

    try {
      const response = await login(loginFormData);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.success) {
        setUser(response.user);
        router.push('/home');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      email: '',
      password: '',
      otp: ''
    });
    setError('');
    setFormStage('initial');
  };

  const handleBack = () => {
    setFormData(prev => ({
      ...prev,
      otp: '' // Clear OTP
    }));
    setError('');
    setFormStage('initial');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-r from-[#323E8F] to-[#1E2657]">
      {/* Left Column - Image */}
      <div className="hidden md:block md:w-1/2 relative flex items-center justify-center min-h-[300px] md:min-h-screen rounded-br-[80px] overflow-hidden">
        <Image
          src="/banner-nu-baliwag.jpg"
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
              src="/nu-shield.png"
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
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
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
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
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
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                      placeholder="Enter your password"
                    />
                  </div>
                </>
              )}

              {formStage === 'otp' && (
                <div>
                  <label className="flex items-center text-gray-700 text-sm font-medium mb-2">
                    <span className="mr-2">OTP</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 102 2h10a2 2 0 012 2v-5a2 2 0 002-2H7V9a3 3 0 016 0V7a3 3 0 00-3-3H5a2 2 0 00-2 2v2h2V7a3 3 0 013-3h5a2 2 0 012 2v1z" />
                    </svg>
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                    placeholder="Enter 6-digit OTP"
                  />
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
                    {loading ? 'Processing...' : 'Login'}
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
                <>
                  <button
                    type="submit"
                    className="w-full bg-[#00204A] text-white py-2 px-4 rounded-md hover:bg-[#002b63] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                </>
              )}
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-blue-500 hover:text-blue-600 text-sm">
                Forgot Password?
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
