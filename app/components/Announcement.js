import { fetchGraphQL } from './graphqlApi'; // Import the fetchGraphQL function
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Import Supabase client

const Announcement = () => {
  const [taskDescription, setTaskDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [repeatOption, setRepeatOption] = useState('none');
  const [telegram, setTelegram] = useState(false);
  const [discord, setDiscord] = useState(false);
  const [message, setMessage] = useState('');
  const [taskList, setTaskList] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [activeTimers, setActiveTimers] = useState([]);

  // Fetch existing tasks from the database
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase.from('ScheduledTask').select('*');
      if (error) {
        console.error('Error fetching tasks:', error.message);
        return;
      }
      setTaskList(
        data.filter(task => task.repeatOption !== 'daily').map((task) => ({
          ...task,
          active: task.active,
          overdue: new Date(task.scheduledDate) < new Date() && task.repeatOption === 'none',
        }))
      );
      setDailyTasks(
        data.filter(task => task.repeatOption === 'daily').map((task) => ({
          ...task,
          active: task.active,
        }))
      );
    };

    fetchTasks();
  }, []);

  // Save a task to Supabase
  const saveTaskToDatabase = async (task) => {
    const { error } = await supabase.from('ScheduledTask').insert([task]);
    if (error) {
      console.error('Error saving task to database:', error.message);
    }
  };

  // Delete a task from Supabase
  const deleteTaskFromDatabase = async (taskId) => {
    const { error } = await supabase.from('ScheduledTask').delete().eq('id', taskId);
    if (error) {
      console.error('Error deleting task from database:', error.message);
    }
  };

  // Update task status in Supabase
  const updateTaskStatus = async (taskId, overdue, active) => {
    const { error } = await supabase
      .from('ScheduledTask')
      .update({ overdue, active })
      .eq('id', taskId);
    if (error) {
      console.error('Error updating task status:', error.message);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!taskDescription || (!scheduledDate && repeatOption !== 'daily') || !scheduledTime) {
      setMessage('Please fill in all required fields.');
      return;
    }

    const currentDateTime = new Date();
    let selectedDateTime = new Date(scheduledDate);

    if (repeatOption !== 'daily') {
      selectedDateTime.setHours(scheduledTime.split(':')[0], scheduledTime.split(':')[1], 0, 0);
    } else {
      selectedDateTime = new Date();
      selectedDateTime.setHours(scheduledTime.split(':')[0], scheduledTime.split(':')[1], 0, 0);
    }

    if (selectedDateTime < currentDateTime) {
      setMessage('Scheduled date cannot be in the past.');
      return;
    }

    const newTask = {
      id: Date.now(),
      description: taskDescription,
      telegram,
      discord,
      repeatOption,
      scheduledDate: selectedDateTime.toISOString(),
      active: true,
      overdue: false,
    };

    saveTaskToDatabase(newTask);

    setTaskList((prevList) => [newTask, ...prevList]);

    if (repeatOption === 'daily') {
      setDailyTasks((prevList) => [newTask, ...prevList]);
    }

    const delay = selectedDateTime - currentDateTime;
    const timerId = scheduleRepeatedTask(delay, newTask);
    setActiveTimers((prevTimers) => [...prevTimers, { id: newTask.id, timerId }]);
  };

  const graphqlQuery = `
    query ScheduledTask($telegram: Boolean!, $discord: Boolean!, $content: String!) {
      scheduledTask(telegram: $telegram, discord: $discord, content: $content)
    }
  `;

  const sendMessage = async (task) => {
    const variables = {
      telegram: task.telegram,
      discord: task.discord,
      content: task.description,
    };

    try {
      await fetchGraphQL(graphqlQuery, variables);
      setMessage(`Message sent successfully: "${task.description}"`);
    } catch (error) {
      setMessage(`Error sending message: ${error.message}`);
    }
  };

  const scheduleRepeatedTask = (delay, task) => {
    const timerId = setTimeout(async () => {
      sendMessage(task);

      if (task.repeatOption === 'daily') {
        scheduleRepeatedTask(24 * 60 * 60 * 1000, task);
      }

      // After task is executed, check if it's overdue and update the task in the database
      if (!task.repeatOption && new Date(task.scheduledDate) < new Date()) {
        setTaskList((prevList) =>
          prevList.map((t) => (t.id === task.id ? { ...t, overdue: true, active: false } : t))
        );
        updateTaskStatus(task.id, true, false); // Mark as overdue and inactive
      }
    }, delay);

    return timerId;
  };

  const handleStop = (taskId) => {
    setTaskList((prevList) =>
      prevList.map((task) =>
        task.id === taskId ? { ...task, active: false } : task
      )
    );
    const timer = activeTimers.find((timer) => timer.id === taskId);
    if (timer) clearTimeout(timer.timerId);
    updateTaskStatus(taskId, false, false); // Mark as inactive in the database
  };

  const handleDelete = (taskId) => {
    setTaskList((prevList) =>
      prevList.filter((task) => task.id !== taskId)
    );
    setDailyTasks((prevList) =>
      prevList.filter((task) => task.id !== taskId)
    );
    const timer = activeTimers.find((timer) => timer.id === taskId);
    if (timer) clearTimeout(timer.timerId);
    deleteTaskFromDatabase(taskId); // Remove task from database
  };

  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Form Section */}
      <div className="space-y-6 p-6 bg-white rounded-lg shadow-md col-span-1">
        <h2 className="text-2xl font-bold text-center mb-4">Schedule an <br></br> <span className='text-blue-500'>AI Announcement ✨</span></h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prompt</label>
            <input
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Scheduled Time:</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Repeat:</label>
            <select
              value={repeatOption}
              onChange={(e) => setRepeatOption(e.target.value)}
              className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          {repeatOption !== 'daily' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Scheduled Date:</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          )}
          <div className="flex items-center">
            <label className="mr-4">Notify on:</label>
            <input
              type="checkbox"
              checked={telegram}
              onChange={() => setTelegram(!telegram)}
              className="mr-2"
            />
            <span>Telegram</span>
            <input
              type="checkbox"
              checked={discord}
              onChange={() => setDiscord(!discord)}
              className="ml-4 mr-2"
            />
            <span>Discord</span>
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              Create Announcement
            </button>
          </div>
          {message && <div className="text-center text-red-600">{message}</div>}
        </form>
      </div>
  
      {/* Scheduled Tasks Section */}
      <div className="space-y-6 p-6 bg-white rounded-lg shadow-md col-span-2">
        <h3 className="text-2xl font-semibold text-black">Scheduled Announcements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-lg pb-4">Upcoming</h4>
            <ul>
              {taskList.map((task) => (
                <li key={task.id} className="p-4 border rounded-md mb-4 shadow-md bg-gray-100">
                  <div className="space-y-2">
                    <p className="font-semibold">{task.description}</p>
                    <p className="text-sm text-gray-500">Scheduled for: {new Date(task.scheduledDate).toLocaleString()}</p>
                    <div className="flex space-x-4 items-center">
                      <span
                        className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${task.overdue ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                      >
                        {task.overdue ? 'Executed' : 'Active'}
                      </span>
                      <button
                        onClick={() => handleStop(task.id)}
                        disabled={task.overdue || !task.active}
                        className="px-4 py-0.5 bg-red-500 text-white rounded-md disabled:opacity-50"
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="px-4 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
  
          {/* Daily Tasks */}
          <div>
            <h4 className="font-semibold text-lg pb-4">Daily Announcements</h4>
            <ul>
              {dailyTasks.map((task) => (
                <li key={task.id} className="p-4 border rounded-md mb-4 shadow-md bg-blue-100">
                  <div className="space-y-2">
                    <p className="font-semibold">{task.description}</p>
                    <div className="flex space-x-4 items-center">
                      <span
                        className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${!task.active ? 'bg-gray-500 text-white' : 'bg-green-500 text-white'}`}
                      >
                        {task.active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleStop(task.id)}
                        disabled={!task.active}
                        className="px-4 py-0.5 bg-red-500 text-white rounded-md disabled:opacity-50"
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="px-4 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default Announcement;
