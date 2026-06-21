import React from 'react';
import DashboardLayout from './layout'; // Import the layout
import DashboardPage from './dashboard'; // Import the dashboard page content

export default function DashboardWrapperPage() {
  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}
