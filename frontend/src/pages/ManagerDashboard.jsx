import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as TaskIcon,
  HourglassEmpty as PendingIcon,
  CheckCircleOutlined as CompleteIcon,
  TrendingUp as TrendIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#f43f5e', '#3b82f6'];

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_URL}/employees/analytics`);
        setData(response.data);
      } catch (err) {
        console.error('Error fetching manager analytics:', err);
        setError('Failed to fetch analytics datasets. Please verify connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h6">{error || 'Data could not be loaded.'}</Typography>
      </Box>
    );
  }

  const { kpis, employee_rankings, department_performance, monthly_trends } = data;

  const cards = [
    { title: 'Total Employees', value: kpis.total_employees, icon: <PeopleIcon fontSize="large" />, color: '#6366f1' },
    { title: 'Total Assigned Tasks', value: kpis.total_tasks, icon: <TaskIcon fontSize="large" />, color: '#3b82f6' },
    { title: 'Pending Tasks', value: kpis.pending_tasks, icon: <PendingIcon fontSize="large" />, color: '#f59e0b' },
    { title: 'Completed Tasks', value: kpis.completed_tasks, icon: <CompleteIcon fontSize="large" />, color: '#10b981' },
    { title: 'Productivity Index', value: `${kpis.productivity_score}%`, icon: <TrendIcon fontSize="large" />, color: '#14b8a6' },
  ];

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* KPI Cards Grid */}
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={2.4} key={card.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#f9fafb' }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts section */}
      <Grid container spacing={3}>
        {/* Productivity Trends */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Monthly Productivity & Compliance
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <AreaChart data={monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '0.8rem' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '0.8rem' }} />
                  <ChartTooltip contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" name="Productivity Score" dataKey="productivity" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProd)" />
                  <Area type="monotone" name="Completion Rate" dataKey="completion_rate" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorComp)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Department Efficiency */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Department Comparison
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart data={department_performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="department_name" stroke="#6b7280" style={{ fontSize: '0.8rem' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '0.8rem' }} />
                  <ChartTooltip contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar name="Tasks Assigned" dataKey="total_tasks" barSize={32} radius={[4, 4, 0, 0]}>
                    {department_performance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                  <Line name="Efficiency (%)" type="monotone" dataKey="efficiency_score" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Employee Rankings Section */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Top Productive Employees
        </Typography>
        <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 650 }}>Rank</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 650 }}>Employee</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 650 }}>Completed Tasks</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 650 }}>On-Time Compliance</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 650 }}>Productivity Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employee_rankings.map((emp, index) => (
                <TableRow key={emp.user_id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.01)' } }}>
                  <TableCell sx={{ fontWeight: 750, color: index < 3 ? 'primary.main' : 'text.primary' }}>
                    #{index + 1}
                  </TableCell>
                  <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS[index % COLORS.length], fontSize: '0.8rem', fontWeight: 700 }}>
                      {emp.name[0]}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 650 }}>{emp.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{emp.completed_tasks} Tasks</TableCell>
                  <TableCell sx={{ width: '22%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={emp.on_time_percentage}
                        color="secondary"
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {emp.on_time_percentage}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'secondary.main' }}>
                    {emp.productivity_score} pts
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default ManagerDashboard;
