# DubMyYT 🎬

> AI-powered video transformation platform with transcription, translation, and subtitle generation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org/)

## 🌟 Overview

DubMyYT is a comprehensive platform that transforms YouTube videos through AI-powered transcription and translation. Upload any video or provide a YouTube URL to get accurate transcripts and translations in multiple languages.

### ✨ Key Features

- **🎥 YouTube Integration** - Direct video processing from YouTube URLs
- **🤖 AI Transcription** - Powered by Groq API for accurate speech-to-text
- **🌍 Multi-Language Translation** - Google Cloud Translate integration
- **📱 Modern UI** - Responsive React frontend with intuitive design
- **🔐 Secure Authentication** - Supabase-powered user management
- **📊 Video History** - Track and manage processed videos
- **🎯 File Upload Support** - Process local audio/video files
- **⚡ Real-time Processing** - Live progress tracking

## 🏗️ Architecture

```
DubMyYT/
├── frontend/          # React application
├── backend/           # Flask API server
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **Google Cloud Project** (for translation)
- **Groq API Account** (for transcription)
- **Supabase Project** (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/DubMyYT.git
   cd DubMyYT
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   ```bash
   # Backend
   cp backend/.env.template backend/.env
   # Edit backend/.env with your API keys
   
   # Frontend
   cp frontend/.env.template frontend/.env
   # Edit frontend/.env with your configuration
   ```

5. **Run the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python app.py
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📖 Documentation

- [📋 Setup Guide](docs/SETUP.md) - Detailed installation instructions
- [🏗️ Architecture](docs/ARCHITECTURE.md) - System design and components
- [🔗 API Documentation](docs/API.md) - REST API endpoints
- [🚀 Deployment](docs/DEPLOYMENT.md) - Production deployment guide
- [🤝 Contributing](CONTRIBUTING.md) - How to contribute
- [📝 Changelog](CHANGELOG.md) - Version history

## 🛠️ Tech Stack

### Frontend
- **React 18+** - UI framework
- **Material-UI** - Component library
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Flask** - Python web framework
- **Groq API** - AI transcription
- **Google Cloud Translate** - Translation service
- **Supabase** - Database and authentication
- **yt-dlp** - YouTube video processing

### Infrastructure
- **Supabase** - PostgreSQL database
- **Google Cloud** - Translation APIs
- **Groq** - AI/ML inference

## 🔧 Configuration

### Required Environment Variables

#### Backend (`backend/.env`)
```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FLASK_ENV=development
```

#### Frontend (`frontend/.env`)
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_BASE_URL=http://localhost:5000
```

## 📱 Usage

1. **Sign Up/Login** - Create an account or sign in
2. **Upload Content** - Provide YouTube URL or upload video/audio file
3. **Process Video** - AI transcribes and translates content
4. **Download Results** - Get transcripts, translations, and subtitles
5. **Manage History** - View and manage processed videos

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://dubmyyt.vercel.app) (if deployed)
- [Documentation](docs/)
- [Issues](https://github.com/yourusername/DubMyYT/issues)
- [Discussions](https://github.com/yourusername/DubMyYT/discussions)

## 🙏 Acknowledgments

- [Groq](https://groq.com) for AI transcription
- [Google Cloud](https://cloud.google.com) for translation services
- [Supabase](https://supabase.com) for backend infrastructure
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) for YouTube processing

---

<div align="center">
  <strong>Built with ❤️ by the DubMyYT Team</strong>
  <br>
  <a href="https://github.com/yourusername/DubMyYT">⭐ Star this repository if you find it helpful!</a>
</div>
