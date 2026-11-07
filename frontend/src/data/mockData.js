export const dashboardMetrics = [
  { label: 'Documents', value: '12' },
  { label: 'Chats', value: '28' },
  { label: 'Messages', value: '146' },
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

export const documents = [
  {
    id: 'doc-123',
    name: 'Employee Handbook.pdf',
    type: 'PDF',
    status: 'Ready',
    chunks: '120',
    uploadedAt: 'Nov 5, 2026 10:24 AM',
    size: '2.4 MB',
    source: 'Upload',
    storage: 'documents/user_001/doc_123.pdf',
  },
  {
    id: 'doc-124',
    name: 'Company Policies.docx',
    type: 'DOCX',
    status: 'Ready',
    chunks: '87',
    uploadedAt: 'Nov 4, 2026 3:10 PM',
    size: '1.8 MB',
    source: 'Upload',
    storage: 'documents/user_001/doc_124.docx',
  },
  {
    id: 'doc-125',
    name: 'Company Website',
    type: 'WEB',
    status: 'Processing',
    chunks: '—',
    uploadedAt: 'Nov 4, 2026 11:02 AM',
    size: '—',
    source: 'Web',
    storage: 'https://example.com',
  },
  {
    id: 'doc-126',
    name: 'Benefits Guide.pdf',
    type: 'PDF',
    status: 'Failed',
    chunks: '—',
    uploadedAt: 'Nov 3, 2026 6:45 PM',
    size: '3.1 MB',
    source: 'Upload',
    storage: 'documents/user_001/doc_126.pdf',
  },
]
