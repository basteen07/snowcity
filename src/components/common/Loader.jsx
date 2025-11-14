import React from 'react';
import loadingImg from '../../assets/images/loading.png'; // path: src/assets/images/loading.png

export default function Loader({ className = '' }) {
  return (
    <div className={`w-full py-10 flex items-center justify-center ${className}`}>
      <img
        src={loadingImg}
        alt="Loading..."
        className="w-24 sm:w-28 md:w-32 lg:w-40 animate-swing"
        width={500}
        height={500}
        decoding="async"
      />
    </div>
  );
}
