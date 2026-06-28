import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Avatar,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  PlayArrow as ProgressIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const PRIORITY_COLORS = {
  Low: 'info',
  Medium: 'warning',
  High: 'error',
  Critical: 'error',
};

const TaskManagement = () => {
  const { user, isManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [statusState, setStatusState] = useState('Pending');
  const [deadline, setDeadline] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchEmployees = async () => {
    if (isManager) {
      try {
        const response = await axios.get(`${API_URL}/employees`);
        setEmployees(response.data);
      } catch (error) {
        console.error('Error fetching employee list:', error);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchTasks();
      await fetchEmployees();
      setLoading(false);
    };
    init();
  }, [isManager]);

  const handleOpenCreateModal = () => {
    setEditTask(null);
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setStatusState('Pending');
    setDeadline(new Date().toISOString().split('T')[0]);
    if (employees.length > 0) setAssignedEmployeeId(employees[0].user_id);
    setModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setStatusState(task.status);
    setDeadline(task.deadline);
    setAssignedEmployeeId(task.assigned_employee_id);
    setModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      description,
      priority,
      status: statusState,
      deadline,
      assigned_employee_id: parseInt(assignedEmployeeId),
    };

    try {
      if (editTask) {
        await axios.put(`${API_URL}/tasks/${editTask.task_id}`, payload);
      } else {
        await axios.post(`${API_URL}/tasks`, payload);
      }
      setModalOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      alert(error.response?.data?.detail || 'Failed to save task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`${API_URL}/tasks/${taskId}`);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await axios.put(`${API_URL}/tasks/${task.task_id}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const columns = {
    Pending: tasks.filter((t) => t.status === 'Pending'),
    'In Progress': tasks.filter((t) => t.status === 'In Progress'),
    Completed: tasks.filter((t) => t.status === 'Completed'),
  };

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Project Task Boards
        </Typography>
        {isManager && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
            sx={{ fontWeight: 700 }}
          >
            Create Task
          </Button>
        )}
      </Box>

      {/* Kanban Board columns */}
      <Grid container spacing={3}>
        {Object.keys(columns).map((colTitle) => {
          const colTasks = columns[colTitle];
          return (
            <Grid item xs={12} md={4} key={colTitle}>
              <Box
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: 3,
                  p: 2,
                  minHeight: 500,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {/* Column header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {colTitle === 'Pending' && <PendingIcon sx={{ color: 'warning.main' }} />}
                    {colTitle === 'In Progress' && <ProgressIcon sx={{ color: 'primary.main' }} />}
                    {colTitle === 'Completed' && <CompleteIcon sx={{ color: 'success.main' }} />}
                    {colTitle}
                  </Typography>
                  <Chip
                    label={colTasks.length}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.04)', fontWeight: 700 }}
                  />
                </Box>

                {/* Cards List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxH: '70vh' }}>
                  {colTasks.map((t) => (
                    <Card
                      key={t.task_id}
                      sx={{
                        borderLeft: `4px solid ${
                          t.priority === 'Critical' || t.priority === 'High' ? '#f43f5e' : '#6366f1'
                        }`,
                      }}
                    >
                      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Chip
                            label={t.priority}
                            color={PRIORITY_COLORS[t.priority]}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }}
                          />
                          
                          {/* Manager controls */}
                          {isManager && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => handleOpenEditModal(t)} sx={{ color: 'text.secondary' }}>
                                <EditIcon fontSize="inherit" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteTask(t.task_id)} sx={{ color: 'error.main' }}>
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>

                        <Typography variant="body1" sx={{ fontWeight: 750, color: '#f9fafb', mb: 1 }}>
                          {t.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {t.description}
                        </Typography>

                        <Divider sx={{ opacity: 0.05, my: 1.5 }} />

                        {/* Assignee & Status changer */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title={`Assigned to: ${t.assigned_employee.name}`}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: '0.75rem', fontWeight: 700 }}>
                                {t.assigned_employee.name[0]}
                              </Avatar>
                            </Tooltip>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                              Due: {t.deadline}
                            </Typography>
                          </Box>

                          {/* Quick Status select */}
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={t.status}
                              onChange={(e) => handleStatusChange(t, e.target.value)}
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                height: 28,
                                [`& .MuiSelect-select`]: { py: 0.5 },
                              }}
                            >
                              <MenuItem value="Pending" style={{ fontSize: '0.75rem' }}>Pending</MenuItem>
                              <MenuItem value="In Progress" style={{ fontSize: '0.75rem' }}>In Progress</MenuItem>
                              <MenuItem value="Completed" style={{ fontSize: '0.75rem' }}>Completed</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Creation / Editing Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
        <form onSubmit={handleSaveTask}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              fullWidth
              label="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={statusState} label="Status" onChange={(e) => setStatusState(e.target.value)}>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Assignee</InputLabel>
                  <Select
                    value={assignedEmployeeId}
                    label="Assignee"
                    onChange={(e) => setAssignedEmployeeId(e.target.value)}
                    required
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.user_id} value={emp.user_id}>
                        {emp.name} ({emp.department?.department_name || 'No Dept'})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Save Task
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TaskManagement;
