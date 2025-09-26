'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-6">CRM Dashboard</h1>
        <p className="mb-6">Real-Time Collaborative CRM Platform</p>
        <div className="space-x-4">
          <Link href="/login" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Login
          </Link>
          <Link href="/dashboard" className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
