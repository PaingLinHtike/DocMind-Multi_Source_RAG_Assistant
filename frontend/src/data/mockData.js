export const dashboardMetrics = [
  { label: 'Documents', value: '12', change: '↑ +20%' },
  { label: 'Chats', value: '28', change: '↑ +17%' },
  { label: 'Messages', value: '146', change: '↑ +32%' },
  { label: 'Storage', value: '82 MB' },
]

export const recentChats = [
  { id: 'annual-leave', title: 'Annual leave policy', time: '2 hours ago' },
  { id: 'working-hours', title: 'Working hours', time: '5 hours ago' },
  { id: 'company-benefits', title: 'Company benefits', time: 'Yesterday' },
]

export const chatConversations = [
  {
    id: 'annual-leave',
    title: 'Annual leave policy',
    messages: [
      { id: 'q1', role: 'user', text: 'How many annual leave days do employees get?' },
      { id: 'a1', role: 'assistant', text: 'Employees receive 20 days of paid annual leave every year. [1]', time: '10:24 AM', citation: { file: 'Employee Handbook.pdf', page: 'Page 17' } },
    ],
  },
  { id: 'working-hours', title: 'Working hours', messages: [] },
  { id: 'company-benefits', title: 'Company benefits', messages: [] },
  { id: 'it-policy', title: 'IT policy', messages: [] },
  { id: 'employee-handbook', title: 'Employee handbook', messages: [] },
]
