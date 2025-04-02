'use client';

import { useRouter } from 'next/navigation';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import useAuthStore from '@/store/useAuthStore';

export default function UnauthorizedPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    const handleGoBack = () => {
        router.back();
    };

    const handleGoHome = () => {
        router.push('/schedules');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
                {/* Lottie Animation */}
                <div className="w-30 h-30 mx-auto">
                    <DotLottieReact
                        src="https://lottie.host/589f009d-74ad-40c7-b02d-4fed1fa50bf6/qPNMkXjC93.lottie"
                        loop
                        autoplay
                    />
                </div>

                {/* Message */}
                <div className="text-center">
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                        Unauthorized Access or Non existent Page
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Please contact your administrator or send an email to <a href="mailto:schednu@gmail.com" className="text-[#323E8F]">schednu@gmail.com</a> if you believe this is an error.
                    </p>
                    {/* <p className="mt-1 text-sm text-gray-500">
            Current role: {user?.role || 'Not logged in'}
          </p> */}
                </div>

                {/* Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={handleGoBack}
                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#323E8F] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
}