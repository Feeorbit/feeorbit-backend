const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'FeeOrbit OS API Specification',
    version: '1.0.0',
    description: `
### ⚡ Intelligent Multi-Tenant Gym Operating System & AI Engine API

FeeOrbit provides a comprehensive suite of cloud microservices for gyms, studios, and fitness centers:
- **Multi-Tenant Isolation**: Automated branch segregation with strict Role-Based Access Control (SuperAdmin, Admin, Staff, Member).
- **Zero-Hardware Attendance**: Real-time QR terminal check-ins and kiosk sync.
- **Smart Diet & AI Coach**: Gemini-powered athletic meal planners, macronutrient balancing, and Indian staple diet optimization.
- **Automated Billing**: Razorpay online payments, dynamic UPI QR links, WhatsApp dues recovery, and tax-compliant digital receipts.
- **Real-Time Communication**: WebSocket channels, announcements, and direct athlete messaging.

**Base URL**: \`/api\`
    `,
    contact: {
      name: 'FeeOrbit Engineering Support',
      email: 'support@feeorbit.com',
      url: 'https://feeorbit-frontend.vercel.app',
    },
  },
  servers: [
    {
      url: 'https://feeorbit-backend-ovhd.onrender.com',
      description: 'Render Cloud Production Server',
    },
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT token received from `/api/auth/login` to authorize requests.',
      },
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'online' },
          timestamp: { type: 'string', format: 'date-time' },
          service: { type: 'string', example: 'FeeOrbit Management API' },
          mongoStatus: { type: 'string', example: 'connected' },
          mongoError: { type: 'string', nullable: true, example: null },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'rahulyo954030@gmail.com' },
          password: { type: 'string', format: 'password', example: 'admin123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '6720e3a9f1a23b0012345678' },
              name: { type: 'string', example: 'Rahul Singh' },
              email: { type: 'string', example: 'rahulyo954030@gmail.com' },
              role: { type: 'string', example: 'admin' },
              gym: { type: 'string', example: '6720e3a9f1a23b0012345679' },
            },
          },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          activeMembers: { type: 'number', example: 45 },
          totalMembers: { type: 'number', example: 52 },
          liveOnFloor: { type: 'number', example: 8 },
          monthlyRevenue: { type: 'number', example: 78500 },
          outstandingDues: { type: 'number', example: 12000 },
          expiringSoon: { type: 'number', example: 3 },
          recentCheckIns: { type: 'array', items: { type: 'object' } },
        },
      },
      AICoachRequest: {
        type: 'object',
        required: ['goal', 'fitnessLevel', 'trainingFrequency', 'dietaryPreference', 'dailyBudget'],
        properties: {
          goal: { type: 'string', example: 'muscle_gain' },
          fitnessLevel: { type: 'string', example: 'intermediate' },
          trainingFrequency: { type: 'number', example: 5 },
          dietaryPreference: { type: 'string', example: 'vegetarian_eggs' },
          dailyBudget: { type: 'number', example: 150 },
          weight: { type: 'number', example: 72 },
          height: { type: 'number', example: 178 },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'System Health Check & Database Gateway Status',
        description: 'Returns API health, server uptime timestamp, and live MongoDB Atlas connection status.',
        tags: ['System & Diagnostics'],
        security: [],
        responses: {
          200: {
            description: 'System is healthy and operational',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'User Authentication & JWT Generation',
        description: 'Authenticates SuperAdmin, Gym Admin, Staff, or Member credentials and returns signed JWT token.',
        tags: ['Authentication & Users'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get Current Authenticated User Profile',
        description: 'Fetches the logged-in user profile, role permissions, active gym workspace, and preferences.',
        tags: ['Authentication & Users'],
        responses: {
          200: { description: 'Authenticated user profile data' },
          401: { description: 'Missing or expired JWT authorization token' },
        },
      },
    },
    '/api/dashboard/stats': {
      get: {
        summary: 'Real-Time Gym Analytics & Command Deck KPIs',
        description: 'Calculates active memberships, live floor attendance, monthly revenue, pending dues, and renewal alerts.',
        tags: ['Dashboard & Analytics'],
        parameters: [
          {
            name: 'gymId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Optional gym ID filter for multi-branch administrators',
          },
        ],
        responses: {
          200: {
            description: 'Analytics summary successfully computed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardStats' },
              },
            },
          },
        },
      },
    },
    '/api/gyms/explore': {
      get: {
        summary: 'Public Gym Directory & Geolocation Explorer',
        description: 'Public endpoint listing registered gyms, facilities, ratings, distance, and contact details.',
        tags: ['Gyms & Workspaces'],
        security: [],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by gym name or address' },
          { name: 'city', in: 'query', schema: { type: 'string' }, description: 'Filter by city' },
          { name: 'lat', in: 'query', schema: { type: 'number' }, description: 'User latitude for distance sorting' },
          { name: 'lng', in: 'query', schema: { type: 'number' }, description: 'User longitude for distance sorting' },
        ],
        responses: {
          200: { description: 'List of matching gym centers' },
        },
      },
    },
    '/api/gyms': {
      get: {
        summary: 'List Gym Workspaces for Current Account',
        tags: ['Gyms & Workspaces'],
        responses: {
          200: { description: 'Gyms list' },
        },
      },
      post: {
        summary: 'Register New Gym Center / Workspace',
        tags: ['Gyms & Workspaces'],
        responses: {
          201: { description: 'Gym successfully created' },
        },
      },
    },
    '/api/members': {
      get: {
        summary: 'List Gym Members',
        description: 'Fetches paginated list of registered athletes with plan status, attendance counts, and balance dues.',
        tags: ['Members & Athletes'],
        responses: {
          200: { description: 'Members array' },
        },
      },
      post: {
        summary: 'Enroll New Member & Issue Digital Membership Pass',
        tags: ['Members & Athletes'],
        responses: {
          201: { description: 'Member successfully registered' },
        },
      },
    },
    '/api/attendance/check-in': {
      post: {
        summary: 'Record Member Check-In via Kiosk or Admin',
        description: 'Logs entrance time, checks membership expiry, updates live on-floor counter, and returns sound cue status.',
        tags: ['Attendance & Kiosk'],
        responses: {
          200: { description: 'Check-in recorded' },
        },
      },
    },
    '/api/attendance/today': {
      get: {
        summary: 'Get Real-Time Attendance Log for Today',
        tags: ['Attendance & Kiosk'],
        responses: {
          200: { description: 'Today attendance entries' },
        },
      },
    },
    '/api/plans': {
      get: {
        summary: 'List Membership Plans & Pricing Packages',
        tags: ['Plans & Pricing'],
        responses: {
          200: { description: 'Plans list' },
        },
      },
      post: {
        summary: 'Create New Membership Plan Package',
        tags: ['Plans & Pricing'],
        responses: {
          201: { description: 'Plan created' },
        },
      },
    },
    '/api/payments': {
      get: {
        summary: 'List Billing Ledger & Fee Records',
        tags: ['Payments & Billing'],
        responses: {
          200: { description: 'Payments list' },
        },
      },
      post: {
        summary: 'Record Manual Offline Fee Payment (Cash/Card/Desk UPI)',
        tags: ['Payments & Billing'],
        responses: {
          201: { description: 'Payment recorded and invoice generated' },
        },
      },
    },
    '/api/payments/create-order': {
      post: {
        summary: 'Generate Razorpay Order for Online Payment Gateway',
        tags: ['Payments & Billing'],
        responses: {
          200: { description: 'Razorpay order created with order_id and key' },
        },
      },
    },
    '/api/ai/nutrition-blueprint': {
      post: {
        summary: 'Generate Athletic Nutrition Blueprint with Google Gemini',
        description: 'Synthesizes targeted calorie counts, protein goals, hydration schedule, and budget-matched Indian staple meal suggestions.',
        tags: ['AI Fitness & Nutrition Engine'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AICoachRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Comprehensive AI fitness blueprint generated' },
        },
      },
    },
    '/api/ai/sync-targets': {
      post: {
        summary: '1-Click Sync AI Nutrition Blueprint to Daily Diet Tracker',
        tags: ['AI Fitness & Nutrition Engine'],
        responses: {
          200: { description: 'Daily nutrition targets successfully saved' },
        },
      },
    },
    '/api/chat/conversations': {
      get: {
        summary: 'Fetch User Chat Channels & Direct Conversations',
        tags: ['Gym Chat & Real-Time'],
        responses: {
          200: { description: 'Active conversations list' },
        },
      },
    },
    '/api/chat/messages': {
      post: {
        summary: 'Send Chat Message with Real-Time WebSocket Broadcast',
        tags: ['Gym Chat & Real-Time'],
        responses: {
          201: { description: 'Message sent' },
        },
      },
    },
    '/api/staff': {
      get: {
        summary: 'List Gym Staff & Trainers',
        tags: ['Staff & Payroll'],
        responses: {
          200: { description: 'Staff list' },
        },
      },
    },
    '/api/payroll': {
      get: {
        summary: 'Get Trainer Salaries & Commission Ledger',
        tags: ['Staff & Payroll'],
        responses: {
          200: { description: 'Payroll records' },
        },
      },
    },
    '/api/equipment': {
      get: {
        summary: 'List Gym Equipment & Maintenance Schedules',
        tags: ['Equipment & Maintenance'],
        responses: {
          200: { description: 'Equipment list' },
        },
      },
    },
    '/api/announcements': {
      get: {
        summary: 'List Gym Notice Board Announcements',
        tags: ['Announcements & Events'],
        responses: {
          200: { description: 'Announcements list' },
        },
      },
    },
  },
};

const swaggerCustomOptions = {
  customCss: `
    .swagger-ui { background-color: #0b0f19; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .swagger-ui .topbar { background-color: #070a13; border-bottom: 1px solid #1e293b; }
    .swagger-ui .topbar .download-url-wrapper .select-label { color: #94a3b8; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title { color: #38bdf8; font-weight: 700; letter-spacing: -0.5px; }
    .swagger-ui .info p, .swagger-ui .info li { color: #cbd5e1; }
    .swagger-ui .scheme-container { background: #0f172a; border-bottom: 1px solid #1e293b; box-shadow: none; }
    .swagger-ui .opblock { border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: #0f172a; margin-bottom: 12px; }
    .swagger-ui .opblock .opblock-summary { border-radius: 9px; }
    .swagger-ui .opblock .opblock-summary-operation-id, .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-path__deprecated { color: #f8fafc; font-weight: 600; }
    .swagger-ui .opblock .opblock-summary-description { color: #94a3b8; }
    .swagger-ui .btn.authorize { color: #38bdf8; border-color: #38bdf8; }
    .swagger-ui .btn.authorize svg { fill: #38bdf8; }
    .swagger-ui section.models { border: 1px solid #1e293b; background: #0f172a; border-radius: 12px; }
    .swagger-ui section.models h4 { color: #e2e8f0; }
  `,
  customSiteTitle: 'FeeOrbit OS — Interactive API Documentation',
  customfavIcon: '/favicon.ico',
};

function setupSwagger(app) {
  // Raw JSON specification
  app.get('/api/docs/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // Interactive Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerCustomOptions));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerCustomOptions));

  console.log('📖 Swagger API Documentation initialized at /api/docs and /api-docs');
}

module.exports = { setupSwagger, swaggerDocument };
