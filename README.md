# BuzzBot - AI Assistant

A comprehensive ChatGPT clone with full feature parity, including multiple chat support, model selection, file uploads, and memory learning capabilities.

## 🚀 Features

- **Multiple Chat Sessions**: Create and manage multiple conversations simultaneously
- **Model Selection**: Switch between OpenAI o3, GPT models and Anthropic Claude models
- **File Upload Support**: Upload images, documents, PDFs, and text files
- **File Generation**: Generate and download various file types
- **Memory System**: AI learns about you over time through conversation history
- **Real-time Chat**: Seamless back-and-forth conversations with typing indicators
- **Dark/Light Theme**: System-aware theme switching
- **Responsive Design**: Works perfectly on desktop and mobile
- **User Authentication**: Secure login with NextAuth
- **Chat Management**: Edit chat titles, delete chats, organize conversations

## 🛠 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: Zustand
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI API, Anthropic Claude API
- **File Processing**: Sharp, Mammoth, PDF-Parse

## 📦 Installation

### Prerequisites

You need to have Node.js and npm installed on your system.

#### Install Node.js and npm:

**macOS (using Homebrew):**
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and npm
brew install node
```

**macOS (using Node.js installer):**
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS version for macOS
3. Run the installer

**Windows:**
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS version for Windows
3. Run the installer

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Copy the environment template
   cp env.template .env
   
   # Edit the .env file with your API keys
   nano .env  # or use your preferred editor
   ```

3. **Configure Environment Variables**
   
   Add your API keys to the `.env` file:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # AI API Keys (get these from their respective websites)
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here  # Generate with: openssl rand -base64 32
   
   # Application Settings
   APP_URL=http://localhost:3000
   UPLOAD_DIR=./uploads
   
   # Feature Flags
   ENABLE_MEMORY_SYSTEM=true
   ENABLE_FILE_UPLOADS=true
   MAX_FILE_SIZE=10MB
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push database schema
   npx prisma db push
   ```

5. **Create Upload Directory**
   ```bash
   mkdir uploads
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Getting API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and add to your `.env` file

### Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and add to your `.env` file

## 🗄️ Database Management

### View Database
```bash
npm run db:studio
```

### Reset Database
```bash
rm dev.db
npx prisma db push
```

### Database Migrations
```bash
npx prisma migrate dev --name migration_name
```

## 📁 Project Structure

```
buzzbot/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── chats/         # Chat management
│   │   ├── files/         # File upload/download
│   │   └── chat/          # AI chat endpoint
│   ├── auth/              # Auth pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── chat/              # Chat-related components
│   ├── ui/                # Reusable UI components
│   └── providers.tsx      # Context providers
├── lib/                   # Utility functions
│   ├── auth.ts            # Auth configuration
│   ├── db.ts              # Database client
│   └── utils.ts           # Helper functions
├── store/                 # State management
│   └── chat-store.ts      # Chat state with Zustand
├── prisma/                # Database schema
│   └── schema.prisma      # Prisma schema
├── uploads/               # File upload directory
└── public/                # Static assets
```

## 🎯 Usage

### Creating a New Chat
1. Click "New Chat" in the sidebar
2. Select your preferred AI model
3. Start typing your message

### Uploading Files
1. Click the paperclip icon in the message input
2. Select files (images, PDFs, documents, text files)
3. Files will be processed and included in your message

### Managing Chats
- **Edit Title**: Click the edit icon next to any chat
- **Delete Chat**: Click the trash icon next to any chat
- **Switch Models**: Use the model selector in the sidebar

### File Management
- **Upload Files**: Click the paperclip icon to upload images, PDFs, documents
- **File Processing**: Automatically extracts text from documents for AI context
- **Download Files**: Download any AI responses as files (text, code, markdown, etc.)
- **File Preview**: View uploaded images and file details inline

### Memory System
The AI automatically learns about you through your conversations:
- Preferences and interests
- Writing style and communication patterns
- Context from previous conversations
- Personal information you share

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Environment Variables**
   Add all environment variables from your `.env` file to Vercel:
   - Go to your project settings on Vercel
   - Add all environment variables
   - Redeploy

3. **Database**
   For production, consider using:
   - **PostgreSQL**: Update `DATABASE_URL` in Prisma schema
   - **MySQL**: Update `DATABASE_URL` in Prisma schema
   - **PlanetScale**: Serverless MySQL platform

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t buzzbot .
   docker run -p 3000:3000 --env-file .env buzzbot
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module" errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Database connection issues**
```bash
npx prisma db push
npx prisma generate
```

**Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**API key not working**
- Ensure API keys are correctly added to `.env`
- Check API key permissions and billing status
- Restart the development server

### Performance Optimization

For better performance:
- Enable caching for API responses
- Optimize image uploads with compression
- Implement message pagination for large chats
- Use Redis for session storage in production

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Include error messages and steps to reproduce

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies. 