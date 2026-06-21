import React from 'react';
import DashboardLayout from '../layout';
import PortfolioPage from './page'; // Assuming PortfolioPage is the default export from page.tsx

export default function DashboardPortfolioWrapperPage() {
  return (
    <DashboardLayout>
      <PortfolioPage />
    </DashboardLayout>
  );
}
