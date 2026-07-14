import { useState } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Truck, 
  Settings, 
  LogOut,
  Bell,
  Menu
} from 'lucide-react';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Categories', href: '/categories', icon: LayoutDashboard }, // You'd use a different icon ideally
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        className="bg-indigo-900 text-white flex-shrink-0 relative transition-all duration-300 z-20 shadow-xl overflow-hidden"
      >
        <div className="h-16 flex items-center justify-center border-b border-indigo-800">
          <motion.div 
            animate={{ scale: sidebarOpen ? 1 : 0.8 }}
            className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
          >
            {sidebarOpen ? 'Inventra' : 'IN'}
          </motion.div>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-indigo-800 text-white shadow-lg' 
                    : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'
                }`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'group-hover:text-blue-300 transition-colors'}`} />
                <motion.span 
                  className="ml-4 font-medium whitespace-nowrap overflow-hidden"
                  animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-indigo-800">
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-3 w-full rounded-xl text-indigo-200 hover:bg-red-500/20 hover:text-red-400 transition-colors group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <motion.span 
              className="ml-4 font-medium whitespace-nowrap overflow-hidden"
              animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0 }}
            >
              Logout
            </motion.span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 z-10 sticky top-0">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <button className="p-2 relative text-gray-500 hover:text-indigo-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:shadow-lg transition-shadow">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50/50 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
