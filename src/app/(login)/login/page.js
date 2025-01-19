'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push('/home');
  };

  const handleClear = () => {
    setFormData({
      email: '',
      password: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center text-gray-700 text-sm font-medium mb-2">
                <span className="mr-2">Email</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </label>
              <input
                type="text"
                name="email"
                placeholder="Enter your username"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              />
            </div>

            <div>
              <label className="flex items-center text-gray-700 text-sm font-medium mb-2">
                <span className="mr-2">Password</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="w-full bg-[#00204A] text-white py-2 px-4 rounded-md hover:bg-[#002b63] transition-colors"
              >
                Login
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
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
