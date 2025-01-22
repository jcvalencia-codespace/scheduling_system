'use client';

import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Loading = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="w-[200px] h-[200px] flex items-center justify-center">
          <div className="w-full h-full">
            <DotLottieReact
              src="https://lottie.host/880ae3cb-096a-4b88-aba6-652a75fcfdfb/qiL4H5TrzZ.json"
              loop
              autoplay
              className="w-full h-full"
              renderer="svg"
            />
          </div>
        </div>
        <div className="text-white text-xl font-semibold mt-4 flex items-center space-x-1">
          <span className="animate-loadingText" style={{ animationDelay: '0s' }}>L</span>
          <span className="animate-loadingText" style={{ animationDelay: '0.1s' }}>o</span>
          <span className="animate-loadingText" style={{ animationDelay: '0.2s' }}>a</span>
          <span className="animate-loadingText" style={{ animationDelay: '0.3s' }}>d</span>
          <span className="animate-loadingText" style={{ animationDelay: '0.4s' }}>i</span>
          <span className="animate-loadingText" style={{ animationDelay: '0.5s' }}>n</span>
          <span className="animate-loadingText" style={{ animationDelay: '0.6s' }}>g</span>
          <span className="flex w-5 justify-center ml-1">
            <span className="animate-loadingDot">.</span>
            <span className="animate-loadingDot" style={{ animationDelay: '0.2s' }}>.</span>
            <span className="animate-loadingDot" style={{ animationDelay: '0.4s' }}>.</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Loading;