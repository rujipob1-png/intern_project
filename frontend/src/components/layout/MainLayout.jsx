import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:ml-64 min-h-screen">
        <Header />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
