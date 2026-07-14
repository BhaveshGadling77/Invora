import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(res => res.data)
  });

  const { data: salesData } = useQuery({
    queryKey: ['monthly-sales'],
    queryFn: () => api.get('/dashboard/monthly-sales').then(res => res.data)
  });

  if (statsLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
      </div>
      <div className="h-96 bg-gray-200 rounded-xl"></div>
    </div>;
  }

  const stats = statsData?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const statCards = [
    { 
      title: 'Total Revenue', 
      value: formatCurrency(stats?.monthlyRevenue || 0),
      icon: DollarSign,
      color: 'from-emerald-400 to-emerald-600',
      trend: '+12.5%',
      up: true
    },
    { 
      title: 'Total Products', 
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'from-blue-400 to-blue-600',
      trend: '+3.2%',
      up: true
    },
    { 
      title: 'Inventory Value', 
      value: formatCurrency(stats?.inventoryValue || 0),
      icon: TrendingUp,
      color: 'from-purple-400 to-purple-600',
      trend: '+5.4%',
      up: true
    },
    { 
      title: 'Low Stock Items', 
      value: stats?.lowStockProducts || 0,
      icon: AlertTriangle,
      color: 'from-orange-400 to-red-500',
      trend: '-2.1%',
      up: false
    }
  ];

  const lineChartData = {
    labels: salesData?.data?.map((s: any) => s.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: salesData?.data?.map((s: any) => s.total) || [12000, 19000, 15000, 22000, 18000, 25000],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#6366f1',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your inventory today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            {/* Decorative gradient blob */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.color} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-out`}></div>
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center font-medium ${stat.up ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.up ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                {stat.trend}
              </span>
              <span className="text-gray-400 ml-2">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview</h3>
          <div className="h-[300px]">
            <Line 
              data={lineChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    border: { display: false },
                    grid: { color: '#f3f4f6' }
                  },
                  x: {
                    border: { display: false },
                    grid: { display: false }
                  }
                }
              }} 
            />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Inventory Status</h3>
          <div className="h-[300px] flex items-center justify-center">
            <Doughnut 
              data={{
                labels: ['In Stock', 'Low Stock', 'Out of Stock'],
                datasets: [{
                  data: [
                    stats?.totalProducts - stats?.lowStockProducts - stats?.outOfStockProducts, 
                    stats?.lowStockProducts, 
                    stats?.outOfStockProducts
                  ],
                  backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                  borderWidth: 0,
                  hoverOffset: 4
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
