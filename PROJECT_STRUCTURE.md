# 🎴 Teen Patti React - Project Structure

## 📁 Root Directory Organization

```
teen-patti-react/
├── 📂 assets/                          Project Assets
│   ├── f503c1185793255.6569ba23ca26f.png
│   └── FRD_Real_Wallet_TeenPatti.pdf
│
├── 📂 client/                          Frontend Application
│   ├── public/
│   ├── src/
│   │   ├── components/                React Components
│   │   │   ├── admin/                Admin-specific components
│   │   │   ├── auth/                 Authentication components
│   │   │   ├── common/               Shared/reusable components
│   │   │   ├── game/                 Game-related components
│   │   │   ├── layout/               Layout components (Navigation, etc.)
│   │   │   ├── pages/                Page components
│   │   │   ├── subscription/         Subscription components
│   │   │   └── transaction/          Transaction components
│   │   │
│   │   ├── hooks/                    Custom React Hooks
│   │   │   └── useSocket.ts
│   │   │
│   │   ├── store/                    State Management
│   │   │   └── gameStore.ts
│   │   │
│   │   ├── types/                    TypeScript Type Definitions
│   │   │   └── game.types.ts
│   │   │
│   │   ├── utils/                    Utility Functions
│   │   │   ├── api.ts               API utilities (fetch, validation, etc.)
│   │   │   ├── routeGuards.ts       Route protection configuration
│   │   │   └── socket.ts            Socket.IO utilities
│   │   │
│   │   ├── App.tsx                  Main App Component
│   │   ├── App.css                  Main App Styles
│   │   ├── main.tsx                 Entry Point
│   │   └── index.css                Global Styles
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── 📂 config/                          Configuration Files
│   ├── render.yaml                   Render deployment config
│   └── vercel.json                   Vercel deployment config
│
├── 📂 docs/                            Documentation
│   ├── README.md                     Documentation index
│   ├── security/                     Security & Auth docs
│   │   ├── AUTH_SYSTEM.md
│   │   ├── ROUTE_PROTECTION.md
│   │   └── SESSION_PERSISTENCE.md
│   ├── features/                     Feature documentation
│   │   └── DUAL_CURRENCY_SYSTEM.md
│   └── architecture/                 Architecture docs (future)
│
├── 📂 scripts/                         Utility Scripts
│   ├── start-client.bat              Start frontend (Windows)
│   └── start-server.bat              Start backend (Windows)
│
├── 📂 server/                          Backend Application
│   ├── src/
│   │   ├── config/                   Configuration
│   │   │   ├── config.ts
│   │   │   └── database.ts
│   │   │
│   │   ├── models/                   Data Models
│   │   │   ├── Card.ts
│   │   │   ├── Deck.ts
│   │   │   ├── GameHistory.model.ts
│   │   │   ├── Player.ts
│   │   │   ├── Table.ts
│   │   │   └── User.model.ts
│   │   │
│   │   ├── repositories/             Data Access Layer
│   │   │   ├── GameHistoryRepository.ts
│   │   │   └── UserRepository.ts
│   │   │
│   │   ├── services/                 Business Logic
│   │   │   ├── CardComparer.ts
│   │   │   └── GameService.ts
│   │   │
│   │   ├── socket/                   Socket.IO Handlers
│   │   │   └── SocketHandler.ts
│   │   │
│   │   └── index.ts                  Server Entry Point
│   │
│   ├── MONGODB_SETUP.md
│   ├── MONGOOSE_GUIDE.md
│   ├── package.json
│   └── tsconfig.json
│
├── 📂 shared/                          Shared Code (Client & Server)
│
├── .gitignore                         Git ignore rules
└── README.md                          Project README

```

## 🎯 Component Organization

### Frontend Components (`client/src/components/`)

#### 1. **admin/** - Admin Dashboard Components
- `AdminDashboard.tsx` - Main admin overview
- `AdminUsers.tsx` - User management
- `AdminTransactions.tsx` - Transaction approval
- `AdminSubscriptionRequests.tsx` - Subscription management
- `AdminProfile.tsx` - Admin profile page

#### 2. **auth/** - Authentication Components
- `Auth.tsx` - Login/Register page
- Form validation and submission
- Authentication flow handling

#### 3. **common/** - Reusable Components
- `AuthRoute.tsx` - Authentication guard
- `AdminRoute.tsx` - Admin-only guard
- `ProtectedRoute.tsx` - Balance/requirement guard
- Shared UI components

#### 4. **game/** - Game Components
- Game table components
- Card components
- Player components
- Game logic UI

#### 5. **layout/** - Layout Components
- `Navigation.tsx` - Main navigation bar
- Header, Footer (if any)
- Layout wrappers

#### 6. **pages/** - Page Components
- `Dashboard.tsx` - Main user dashboard
- `ProfilePage.tsx` - User profile
- `WalletPage.tsx` - Wallet management
- Feature-specific pages

#### 7. **subscription/** - Subscription Components
- `SubscriptionRequest.tsx` - Subscription form
- Subscription status display
- Subscription management UI

#### 8. **transaction/** - Transaction Components
- `TransactionRequest.tsx` - Deposit/Withdrawal forms
- Transaction history
- Transaction status display

## 🔧 Utility Organization (`client/src/utils/`)

### 1. **api.ts** - API Utilities
Central location for all API-related functions:
- `API_URL` - Base API endpoint
- `apiFetch()` - Unified fetch wrapper
- `getUserId()` - Get user from localStorage
- `showAlert()` - Formatted alert messages
- `showConfirm()` - Confirmation dialogs
- `validateRequired()` - Form validation
- `formatDate()` - Date formatting
- `formatCurrency()` - Currency formatting

### 2. **routeGuards.ts** - Route Protection
Route security and access control:
- `ROUTE_GUARDS` - Route configuration
- `canAccessRoute()` - Permission checking
- Route requirement definitions

### 3. **socket.ts** - WebSocket Utilities
Socket.IO client utilities:
- Socket connection management
- Event handlers
- Real-time communication

## 🗄️ Server Organization (`server/src/`)

### 1. **config/** - Configuration
- `config.ts` - Environment variables
- `database.ts` - Database connection

### 2. **models/** - Data Models
- `User.model.ts` - User schema
- `GameHistory.model.ts` - Game history schema
- Game-related models (Card, Deck, Player, Table)

### 3. **repositories/** - Data Access
- `UserRepository.ts` - User data operations
- `GameHistoryRepository.ts` - Game history operations
- Abstraction layer for database queries

### 4. **services/** - Business Logic
- `GameService.ts` - Game logic
- `CardComparer.ts` - Card comparison logic
- Service layer for complex operations

### 5. **socket/** - WebSocket Handlers
- `SocketHandler.ts` - Socket event handling
- Real-time game updates
- Player communication

## 📚 Documentation Organization (`docs/`)

### 1. **security/** - Security Documentation
- Authentication system
- Route protection
- Session management
- Security best practices

### 2. **features/** - Feature Documentation
- Dual currency system
- Wallet management
- Subscription system
- Game features

### 3. **architecture/** - Architecture Documentation
- System design
- Database schema
- API documentation
- Component hierarchy

## 🔒 Configuration Files

### Root Level
- `.gitignore` - Git exclusions
- `README.md` - Project overview

### Client
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies

### Server
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies

### Deployment (`config/`)
- `render.yaml` - Render.com config
- `vercel.json` - Vercel config

## 🎨 Assets Organization (`assets/`)

### Current Assets
- Design mockups (PNG)
- Functional requirements (PDF)
- Project resources

### Future Assets
- Game card images
- UI icons
- Sound effects
- Branding materials

## 📜 Scripts Organization (`scripts/`)

### Batch Scripts (Windows)
- `start-client.bat` - Start frontend dev server
- `start-server.bat` - Start backend server

### Future Scripts
- Build scripts
- Deployment scripts
- Database migration scripts
- Test automation scripts

## 🚀 Quick Start Guide

### Frontend Development
```bash
cd client
npm install
npm run dev
```

### Backend Development
```bash
cd server
npm install
npm start
```

### Using Scripts (Windows)
```bash
# From root directory
scripts\start-client.bat
scripts\start-server.bat
```

## 🔄 File Organization Best Practices

### Component Files
```
ComponentName/
├── ComponentName.tsx       (Component logic)
├── ComponentName.css       (Component styles)
└── ComponentName.test.tsx  (Component tests)
```

### Utility Files
```
utils/
├── api.ts          (API utilities)
├── validation.ts   (Validation utilities)
└── formatting.ts   (Formatting utilities)
```

### Documentation Files
```
docs/
├── category/
│   ├── FEATURE_NAME.md
│   └── README.md
```

## 📊 Maintenance Guidelines

### Adding New Features
1. Create component in appropriate folder
2. Add utility functions to `utils/`
3. Add types to `types/`
4. Create documentation in `docs/`
5. Update this structure document

### Refactoring
1. Keep related files together
2. Use consistent naming conventions
3. Update documentation
4. Maintain folder structure

### Documentation
1. Update docs when adding features
2. Keep structure documentation current
3. Add examples and usage guides
4. Cross-reference related docs

## 🔍 Finding Files Quickly

### By Feature
- **Authentication**: `client/src/components/auth/`, `docs/security/`
- **Wallet**: `client/src/components/pages/WalletPage.tsx`, `docs/features/`
- **Admin**: `client/src/components/admin/`, `docs/security/`
- **Game**: `client/src/components/game/`, `server/src/services/`

### By Type
- **Components**: `client/src/components/`
- **Utils**: `client/src/utils/`
- **Models**: `server/src/models/`
- **Docs**: `docs/`
- **Config**: `config/`

### By Function
- **API Calls**: `client/src/utils/api.ts`
- **Route Guards**: `client/src/utils/routeGuards.ts`
- **Database**: `server/src/repositories/`
- **Business Logic**: `server/src/services/`

## 📈 Project Statistics

### Frontend
- **Components**: 30+ organized in 8 categories
- **Utilities**: 3 utility files with 20+ functions
- **Pages**: 5+ main pages
- **Routes**: 10+ protected routes

### Backend
- **Models**: 6+ data models
- **Services**: 2+ business logic services
- **Repositories**: 2+ data access layers
- **APIs**: RESTful + Socket.IO real-time

### Documentation
- **Security Docs**: 3 comprehensive guides
- **Feature Docs**: 1+ feature guides
- **Total Pages**: 10+ documentation pages

---

**Last Updated:** November 2, 2025  
**Version:** 1.0.0  
**Structure Type:** Organized by Feature and Function
