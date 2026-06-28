import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  Assignment as TaskIcon,
  CheckCircle as CompleteIcon,
  HourglassEmpty as PendingIcon,
  Warning as WarningIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const PIE_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#f43f5e'];

const EmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const analyticsRes = await axios.get(`${API_URL}/employees/me/analytics`);
        const tasksRes = await axios.get(`${API_URL}/tasks`);
        setData(analyticsRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        console.error('Error fetching employee dashboard stats:', err);
        setError('Failed to fetch performance indicators.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <CircularProgress color="secondary" />
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

  const { kpis, trends } = data;

  const cards = [
    { title: 'My Total Tasks', value: kpis.total_tasks, icon: <TaskIcon fontSize="large" />, color: '#6366f1' },
    { title: 'Completed', value: kpis.completed_tasks, icon: <CompleteIcon fontSize="large" />, color: '#10b981' },
    { title: 'Pending / Ongoing', value: kpis.pending_tasks + kpis.in_progress_tasks, icon: <PendingIcon fontSize="large" />, color: '#f59e0b' },
    { title: 'Overdue Warnings', value: kpis.overdue_tasks, icon: <WarningIcon fontSize="large" />, color: '#f43f5e' },
    { title: 'Productivity Score', value: `${kpis.productivity_score}%`, icon: <CalendarIcon fontSize="large" />, color: '#14b8a6' },
  ];

  // Calculate task priorities for the pie chart
  const priorityCount = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(priorityCount).map((k) => ({
    name: `${k} Priority`,
    value: priorityCount[k],
  }));

  // Fetch top 3 upcoming tasks due soon
  const urgentTasks = tasks
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* KPI stats */}
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={2.4} key={card.title}>
            <Card>
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

      {/* Analytics Charts */}
      <Grid container spacing={3}>
        {/* Workload Progress */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Task Completion Progress
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '0.8rem' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '0.8rem' }} />
                  <ChartTooltip contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Line name="Assigned Tasks" type="monotone" dataKey="tasks" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line name="Completed Tasks" type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Task Priorities Split */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Workload Priorities
            </Typography>
            {pieData.length > 0 ? (
              <Box sx={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No tasks found for priority mapping.</Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Deadline warnings */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" /> Upcoming Critical Deadlines
        </Typography>
        {urgentTasks.length > 0 ? (
          <List>
            {urgentTasks.map((t) => {
              const isOverdue = new Date(t.deadline) < new Date();
              return (
                <ListItem
                  key={t.task_id}
                  sx={{
                    mb: 1.5,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.04)',
                    backgroundColor: isOverdue ? 'rgba(244,63,94,0.04)' : 'rgba(255,255,255,0.01)',
                  }}
                  secondaryAction={
                    <Chip
                      label={t.priority}
                      color={t.priority === 'Critical' || t.priority === 'High' ? 'error' : 'default'}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40, color: isOverdue ? 'error.main' : 'warning.main' }}>
                    <WarningIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t.title}
                    primaryTypographyProps={{ fontWeight: 700 }}
                    secondary={`Deadline: ${t.deadline} ${isOverdue ? '(OVERDUE)' : ''}`}
                    secondaryTypographyProps={{ color: isOverdue ? 'error.light' : 'text.secondary', fontWeight: 500 }}
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary', p: 1 }}>
            Great job! You have no pending tasks with immediate deadlines.
          </Typography>
        )}
      </Card>
    </Box>
  );
};

export default EmployeeDashboard;
