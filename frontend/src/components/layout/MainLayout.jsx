import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
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
