# DubMyYT - AI-Powered Video Subtitling and Summarizing Platform

A comprehensive full-stack application for video transcription, translation,summarization and intelligent content analysis using simple AI technologies.

## Demo Video
https://github.com/user-attachments/assets/af5869b9-6c66-4936-959b-f2370b85b481

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Schema](#database-schema)
- [Workflow Diagrams](#workflow-diagrams)
- [Current Features](#current-features)
- [Upcoming Features](#upcoming-features)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [License](#license)

## Overview

DubMyYT is a modern web application that leverages artificial intelligence to transform video content through automated transcription, multi-language translation, and intelligent content analysis. The platform provides users with comprehensive tools for video content management, analysis, and interaction.

### Technology Stack

**Frontend**
- Node.js 16+ runtime environment for development and build tools
- React 18+ with functional components and hooks
- npm package manager for dependency management
- Webpack (via Create React App) for module bundling and optimization
- Tailwind CSS for responsive design
- Axios for HTTP client communication
- React Router for single-page application routing
- Supabase client for real-time authentication

**Backend**
- Python 3.8+ runtime environment
- Flask 2.0+ Python web framework
- pip package manager for Python dependencies
- Groq API for AI-powered transcription
- Google Cloud Translate for multi-language support
- Supabase for PostgreSQL database and authentication
- yt-dlp for YouTube video processing

**Infrastructure**
- Node.js development server (development environment)
- Supabase (PostgreSQL) for data persistence
- Google Cloud Platform for translation services
- Groq Cloud for AI/ML inference
- Git/GitHub for version control

## System Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Browser   │────▶│   React Frontend │────▶│   Flask Backend │
│   (Client)      │     │   (Node.js 3000) │     │   (Python 5000) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                        ┌─────────────────┐               │
                        │   Supabase      │◀──────────────┤
                        │   PostgreSQL    │               │
                        └─────────────────┘               │
                                                          │
                        ┌─────────────────┐               │
                        │   Google Cloud  │◀──────────────┤
                        │   Translate API │               │
                        └─────────────────┘               │
                                                          │
                        ┌─────────────────┐               │
                        │   Groq API      │◀──────────────┘
                        │   (Whisper AI)  │
                        └─────────────────┘
```

### Component Overview

The system follows a microservices-oriented architecture with clear separation of concerns:

- **Presentation Layer**: React-based SPA handling user interface and interactions
- **Application Layer**: Flask REST API managing business logic and external integrations
- **Data Layer**: Supabase PostgreSQL for persistent data storage
- **External Services**: AI/ML APIs for content processing

## Frontend Architecture

### Component Structure

```
frontend/src/
├── components/
│   ├── Auth/
│   │   ├── AuthPage.js          # Authentication interface
│   │   └── AuthPage.css         # Authentication styling
│   ├── Dashboard/
│   │   ├── Dashboard.js         # Analytics dashboard
│   │   ├── StatsOverview.js     # Statistics components
│   │   ├── UsageChart.js        # Usage visualization
│   │   ├── SummariesChart.js    # Summary analytics
│   │   └── SubtitlesChart.js    # Subtitle analytics
│   ├── LandingPage.js           # Marketing homepage
│   ├── UserMenu.js              # Navigation component
│   ├── ProtectedRoute.js        # Route authentication
│   └── ui.js                    # Reusable UI components
├── supabase/
│   └── config.js                # Supabase configuration
├── App.js                       # Main application router
├── DubMyYt.js                   # Core video processing interface
├── index.js                     # Application entry point
└── styles/                      # Global styling
```

### State Management

The frontend uses React's built-in state management with hooks:

- **useState**: Component-level state management
- **useEffect**: Side effects and lifecycle management
- **useContext**: Global state sharing (authentication)
- **useCallback**: Performance optimization for functions

### Data Flow Pattern

```
User Interaction → Component State → API Call → Backend Processing → Database Update → Real-time UI Update
```

## Backend Architecture

### Module Structure

```
backend/
├── app.py                      # Main Flask application and routing
├── server.py                   # Server configuration and middleware
├── transcription.py            # Groq API integration module
├── yt_video_to_text.py        # YouTube processing pipeline
├── requirements.txt            # Python dependencies
└── uploads/                    # Temporary file storage
```

### API Layer Design

The backend follows RESTful API principles with the following endpoint categories:

**Authentication Endpoints**
- User registration and login
- Session management
- Password reset functionality

**Video Processing Endpoints**
- YouTube URL processing
- File upload handling
- Transcription generation
- Translation services

**Data Management Endpoints**
- Video history retrieval
- User analytics
- Content management

### External Service Integration

**Groq API Integration**
```python
def transcribe_audio(audio_file_path):
    with open(audio_file_path, "rb") as file:
        transcription = groq_client.audio.transcriptions.create(
            file=file,
            model="whisper-large-v3",
            response_format="text"
        )
    return transcription
```

**Google Translate Integration**
```python
def translate_text(text, target_language):
    translate_client = translate.Client()
    result = translate_client.translate(
        text,
        target_language=target_language
    )
    return result['translatedText']
```


## Workflow Diagrams

### Video Processing Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│  Frontend   │───▶│  Backend    │
│  Submits    │    │  Validates  │    │  Receives   │
│  Video URL  │    │  Input      │    │  Request    │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Database   │◀───│  Store Job  │◀───│  Create Job │
│  Updated    │    │  Metadata   │    │  Record     │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  yt-dlp     │───▶│  Extract    │───▶│  Download   │
│  Downloads  │    │  Audio      │    │  Video      │
│  Content    │    │  Track      │    │  Content    │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Groq API   │───▶│  Transcribe │───▶│  Process    │
│  Returns    │    │  Audio to   │    │  Audio      │
│  Text       │    │  Text       │    │  File       │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Google     │───▶│  Translate  │───▶│  Send to    │
│  Translate  │    │  Content    │    │  Translation│
│  Returns    │    │  to Target  │    │  Service    │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │◀───│  Return     │◀───│  Store      │
│  Displays   │    │  Results    │    │  Results in │
│  Results    │    │  to User    │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### User Data Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │───▶│   React     │───▶│   Flask     │
│   Request   │    │   Router    │    │   API       │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                   ┌─────────────┐            │
                   │  Supabase   │◀───────────┤
                   │  Auth       │            │
                   └─────────────┘            │
                                              │
                   ┌─────────────┐            │
                   │  Business   │◀───────────┤
                   │  Logic      │            │
                   └─────────────┘            │
                                              │
                   ┌─────────────┐            │
                   │  External   │◀───────────┤
                   │  APIs       │            │
                   └─────────────┘            │
                                              │
                   ┌─────────────┐            │
                   │  Database   │◀───────────┘
                   │  Operations │
                   └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │◀───│   JSON      │◀───│   Response  │
│   Update    │    │   Response  │    │   Data      │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│  Frontend   │───▶│  Supabase   │
│  Submits    │    │  Validates  │    │  Auth       │
│  Credentials│    │  Form Data  │    │  Service    │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │◀───│  JWT Token  │◀───│  Validate   │
│  Stores     │    │  Returned   │    │  User       │
│  Session    │    │             │    │  Account    │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
┌─────────────┐    ┌─────────────┐
│  API        │◀───│  Include    │
│  Requests   │    │  Bearer     │
│  Authorized │    │  Token      │
└─────────────┘    └─────────────┘
```

## Current Features

### Video Processing
- **YouTube Integration**: Direct video processing from YouTube URLs
- **File Upload Support**: Process local video and audio files
- **Multiple Format Support**: MP4, MP3, WAV, and other common formats

### AI-Powered Subtitle Generation
- **Automatic Speech Recognition**: Using Groq's Whisper AI model
- **High Accuracy**: Advanced language model for precise transcription
- **Multiple Languages**: Support for 50+ languages
- **Timestamp Generation**: Precise time-aligned subtitles
  
### Content Summarization
- **Intelligent Summaries**: AI-generated content summaries
- **Customizable Length**: Short, medium, and detailed summaries
- **Key Points Extraction**: Highlight important concepts
- **Topic Categorization**: Automatic content categorization
- **Summary Templates**: Different summary formats for various use cases
  
### Multi-Language Translation
- **Google Translate Integration**: Professional-grade translation quality
- **100+ Language Support**: Comprehensive language coverage
- **Context-Aware Translation**: Maintains meaning and context
- **Bulk Translation**: Process multiple content pieces simultaneously

### Content Management
- **Video History**: Complete history of processed videos
- **Search and Filter**: Advanced search capabilities
- **Export Options**: Download transcripts and translations
- **Delete Management**: Remove videos with cascade deletion

### User Interface
- **Responsive Design**: Mobile-first responsive interface
- **Modern UI Components**: Clean, professional design
- **Real-time Updates**: Live progress and status updates
- **Intuitive Navigation**: User-friendly interface design

### Analytics Dashboard
- **Processing Statistics**: Track usage patterns and metrics
- **Language Analytics**: Most used languages and preferences
- **Performance Metrics**: Processing times and success rates
- **Visual Charts**: Interactive data visualization

### Security Features
- **User Authentication**: Secure login and registration
- **Data Encryption**: End-to-end data protection
- **Access Control**: User-specific data isolation
- **Input Validation**: Comprehensive security measures

## Upcoming Features

### Interactive Chat System
- **Video Chat Interface**: Chat with AI about video content
- **Context-Aware Responses**: AI understands video context
- **Question Generation**: Automatic question suggestions
- **Multi-turn Conversations**: Extended dialogue capabilities
- **Bookmark Conversations**: Save important chat sessions

### Advanced Note-Taking
- **Timestamp-Linked Notes**: Notes tied to specific video moments
- **Rich Text Editor**: Advanced formatting options
- **Tag System**: Organize notes with custom tags
- **Search Functionality**: Full-text search across all notes
- **Export Capabilities**: Export notes in multiple formats
- **Collaborative Notes**: Share and collaborate on notes

### Quiz Generation System
- **Automatic Quiz Creation**: AI-generated questions from video content
- **Multiple Question Types**: Multiple choice, true/false, short answer
- **Difficulty Levels**: Adaptive difficulty based on content
- **Progress Tracking**: Monitor learning progress
- **Performance Analytics**: Detailed quiz performance metrics
- **Custom Quiz Creation**: User-generated quiz questions

### Advanced Analytics
- **Learning Insights**: Track learning patterns and preferences
- **Content Recommendations**: AI-powered content suggestions
- **Usage Analytics**: Detailed platform usage statistics
- **Performance Metrics**: Learning effectiveness measurements
- **Export Reports**: Comprehensive analytics exports

### Integration Features
- **Calendar Integration**: Schedule learning sessions
- **Email Notifications**: Progress updates and reminders
- **Third-party Exports**: Integration with note-taking apps
- **API Access**: Developer API for custom integrations
- **Webhook Support**: Real-time event notifications

### Mobile Application
- **Cross-platform App**: iOS and Android native apps
- **Offline Capabilities**: Download content for offline access
- **Mobile-optimized UI**: Touch-friendly interface design
- **Push Notifications**: Real-time mobile notifications
- **Synchronization**: Seamless sync across devices

## Installation & Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- FFmpeg
- Git

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.template .env
# Configure environment variables
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.template .env
# Configure environment variables
npm start
```

### Environment Configuration

**Backend (.env)**
```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FLASK_ENV=development
```

**Frontend (.env)**
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_BASE_URL=http://localhost:5000
```

## API Documentation

### Authentication Endpoints

```
POST /auth/login          # User authentication
POST /auth/register       # User registration
GET  /auth/user          # Get user profile
POST /auth/logout        # User logout
```

### Video Processing Endpoints

```
POST /process-youtube     # Process YouTube video
POST /upload-file        # Upload and process local file
GET  /video-history      # Get user's video history
DELETE /video/{id}       # Delete video from history
GET  /download/{file_id} # Download processed content
```

### Content Management Endpoints

```
POST /translate          # Translate text content
GET  /languages         # Get supported languages
GET  /analytics         # Get user analytics
POST /feedback          # Submit user feedback
```


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with modern web technologies for scalable video content processing and analysis.**
