'use client';

import Image from 'next/image';

const NoData = ({ 
  message = "No data available", 
  description = "There are no items to display at the moment.",
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="relative w-48 h-48 mb-4">
        <Image
          src="https://i.imgur.com/VYEr8o2.jpeg"
          alt="No data illustration"
          fill
          className="object-contain"
          priority
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {message}
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        {description}
      </p>
    </div>
  );
};

export default NoData;
