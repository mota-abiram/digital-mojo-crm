import React, { useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, Target, Users, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

const Dashboard: React.FC = () => {
  const { opportunities, fetchOpportunities, contacts, fetchContacts, stages } = useStore();
  const [timeRange, setTimeRange] = React.useState('30'); // '30', '7', '1'

  useEffect(() => {
    fetchOpportunities();
    fetchContacts();
  }, [fetchOpportunities, fetchContacts]);

  // Filter Opportunities by Time Range
  const filteredOpportunities = React.useMemo(() => {
    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - parseInt(timeRange));

    // Set to start of the day for accurate comparison
    pastDate.setHours(0, 0, 0, 0);

    return opportunities.filter(opp => {
      if (!opp.createdAt) return false;
      const oppDate = new Date(opp.createdAt);
      return oppDate >= pastDate;
    });
  }, [opportunities, timeRange]);

  // Calculate Stats using filtered data
  const totalPipelineValue = filteredOpportunities.reduce((sum, opp) => sum + Number(opp.value), 0);

  // Strict check for 'Won' status. 
  // If 'Closed' stage (ID 10) implies Won, we should ensure the dragging logic sets status='Won'.
  // Here we assume status is the source of truth.
  const wonOpportunities = filteredOpportunities.filter(opp => opp.status === 'Won' || opp.stage === '10').length;
  const totalOpportunities = filteredOpportunities.length;
  const conversionRate = totalOpportunities > 0 ? ((wonOpportunities / totalOpportunities) * 100).toFixed(1) : '0';

  // Funnel Data: Sort stages logically (Start -> End)
  // Order: 16 (Yet to Contact) -> ... -> 21 (Cheque Ready) -> 10 (Closed)
  // We exclude '0 - Junk' from the visual funnel as it's a dropout bucket.
  const stageOrder = ['16', '17', '18', '19', '20', '20.5', '21', '10'];

  const funnelData = stageOrder.map(id => {
    const stage = stages.find(s => s.id === id);
    if (!stage) return null;
    return {
      name: stage.title.split(' - ')[1] || stage.title, // Clean name (remove "16 - ")
      fullName: stage.title,
      value: filteredOpportunities.filter(o => o.stage === id).length,
      fill: stage.color
    };
  }).filter(Boolean) as any[];

  // Pipeline Trend (Cumulative value over time based on creation date)
  const pipelineData = React.useMemo(() => {
    const sortedOpps = [...filteredOpportunities].sort((a, b) =>
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

    let cumulativeValue = 0;
    const trendMap = new Map<string, number>();

    sortedOpps.forEach(opp => {
      if (opp.createdAt) {
        const date = new Date(opp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        cumulativeValue += Number(opp.value);
        trendMap.set(date, cumulativeValue);
      }
    });

    return Array.from(trendMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOpportunities]);

  // Task Data (Aggregated from Opportunity Tasks)
  const taskData = React.useMemo(() => {
    const allTasks = filteredOpportunities.flatMap(o => o.tasks || []);
    const completed = allTasks.filter(t => t.isCompleted).length;
    const pending = allTasks.length - completed;

    if (allTasks.length === 0) return [];

    return [
      { name: 'Completed', value: completed },
      { name: 'Pending', value: pending }
    ];
  }, [filteredOpportunities]);

  const taskColors = ['#1ea34f', '#eb7311'];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
          >
            <option value="30">Last 30 Days</option>
            <option value="7">Last 7 Days</option>
            <option value="1">Today</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Opportunities', value: totalOpportunities.toString(), change: '+0%', isPositive: true, icon: Target },
          { label: 'Pipeline Value', value: `₹${totalPipelineValue.toLocaleString()}`, change: '+0%', isPositive: true, icon: IndianRupee },
          { label: 'Conversion Rate', value: `${conversionRate}%`, change: '0%', isPositive: true, icon: TrendingUp },
          { label: 'Closed Won', value: wonOpportunities.toString(), change: '+0%', isPositive: true, icon: CheckCircle },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</h3>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Charts Area - Now Full Width */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Funnel */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Lead Conversion Funnel</h3>
              <div className="h-96">
                {funnelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={60}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-2 border border-gray-200 shadow-lg rounded">
                                <p className="font-bold">{data.fullName}</p>
                                <p className="text-sm">Count: {data.value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
                )}
              </div>
            </div>

            {/* Pipeline Trend */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Pipeline Value Trend</h3>
              <div className="h-96">
                {pipelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pipelineData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1ea34f" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#1ea34f" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#1ea34f" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">No trend data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Wide Chart / Task Breakdown */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-around">
            <div className="w-full md:w-1/2">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Task Distribution</h3>
              <p className="text-sm text-gray-500 mb-6">Overview of team activity status.</p>
              <div className="space-y-3">
                {taskData.length > 0 ? taskData.map((task, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: taskColors[i] }}></div>
                      <span className="text-sm font-medium text-gray-700">{task.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{task.value}</span>
                  </div>
                )) : <p className="text-sm text-gray-400">No tasks found.</p>}
              </div>
            </div>
            <div className="w-full md:w-1/2 h-64 flex items-center justify-center">
              {taskData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={taskColors[index % taskColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400">No data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
