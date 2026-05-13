import React, { useEffect, useState } from 'react';
import { FiTruck, FiUsers, FiWrench, FiAlertCircle } from 'react-icons/fi';
import vehicleService from '../../services/vehicleService';
import driverService from '../../services/driverService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    vehiclesWithExpiredDocs: 0,
    totalDrivers: 0,
    driversWithExpiredLicenses: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [vehiclesRes, driversRes] = await Promise.all([
          vehicleService.getVehicles(),
          driverService.getDrivers(),
        ]);

        const expiredVehicles = vehiclesRes.results?.filter(
          (v: any) => v.soat_days_until_expiration <= 0 || v.rtm_days_until_expiration <= 0
        ).length || 0;

        const expiredDrivers = driversRes.results?.filter(
          (d: any) => d.is_license_expired
        ).length || 0;

        setStats({
          totalVehicles: vehiclesRes.count || 0,
          vehiclesWithExpiredDocs: expiredVehicles,
          totalDrivers: driversRes.count || 0,
          driversWithExpiredLicenses: expiredDrivers,
        });
      } catch (error) {
        toast.error('Error cargando estadísticas');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <Icon className="text-4xl" style={{ color }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido al Panel de Control de Logística-Hub</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiTruck}
          label="Vehículos Total"
          value={stats.totalVehicles}
          color="#3B82F6"
        />
        <StatCard
          icon={FiAlertCircle}
          label="Documentos Vencidos"
          value={stats.vehiclesWithExpiredDocs}
          color="#EF4444"
        />
        <StatCard
          icon={FiUsers}
          label="Conductores Total"
          value={stats.totalDrivers}
          color="#10B981"
        />
        <StatCard
          icon={FiWrench}
          label="Licencias Vencidas"
          value={stats.driversWithExpiredLicenses}
          color="#F59E0B"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Estado de Cumplimiento</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    {
                      name: 'Vigentes',
                      value: stats.totalVehicles - stats.vehiclesWithExpiredDocs,
                    },
                    {
                      name: 'Vencidos',
                      value: stats.vehiclesWithExpiredDocs,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Alertas Activas</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <span className="text-gray-700">Documentos por vencer (7 días)</span>
              <span className="text-2xl font-bold text-red-600">-</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <span className="text-gray-700">Mantenimientos próximos</span>
              <span className="text-2xl font-bold text-yellow-600">-</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <span className="text-gray-700">Multas pendientes</span>
              <span className="text-2xl font-bold text-blue-600">-</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Actividad Reciente</h2>
        <div className="text-center text-gray-500 py-8">
          No hay actividad reciente
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
