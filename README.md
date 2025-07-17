# DubMyYT - YouTube Video Translation Platform

A comprehensive platform for downloading YouTube videos, extracting audio, transcribing content, and translating it to multiple languages using AI-powered services.

## Features

- **YouTube Video Processing**: Download videos and extract audio
- **AI-Powered Transcription**: Convert audio to text using Groq API
- **Multi-Language Translation**: Translate content using Google Cloud Translate
- **Modern Web Interface**: React-based frontend with responsive design
- **Secure Backend**: Flask API with environment-based configuration
- **Database Integration**: Supabase for data management and analytics

## Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **Google Cloud Project** (for translation services)
- **Groq API Account** (for transcription)
- **Supabase Project** (for database)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd DubMyYT
```

### 2. Backend Setup

```bash
cd theinterface/webapp_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.template .env
# Edit .env with your actual credentials
```

### 3. Frontend Setup

```bash
cd theinterface/webapp_frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.template .env
# Edit .env with your actual credentials
```

## Environment Configuration

### Backend (.env)

```env
# Groq API Configuration
groqclient=your_groq_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_role_key_here

# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-cloud-credentials.json
```

### Frontend (.env)

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
REACT_APP_API_URL=http://localhost:5000  # For local development
```

## API Keys & Credentials Setup

### 1. Groq API
1. Visit [Groq Console](https://console.groq.com/)
2. Create an account and generate an API key
3. Add the key to your backend .env file as `groqclient`

### 2. Google Cloud Translate
1. Create a [Google Cloud Project](https://console.cloud.google.com/)
2. Enable the Cloud Translation API
3. Create a service account and download the JSON credentials
4. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of the JSON file

### 3. Supabase
1. Create a [Supabase Project](https://supabase.com/)
2. Get your project URL and keys from Settings > API
3. Add the URL and keys to both frontend and backend .env files

## Running the Application

### Development Mode

#### Backend (Terminal 1)
```bash
cd theinterface/webapp_backend
python server.py
```

#### Frontend (Terminal 2)
```bash
cd theinterface/webapp_frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
DubMyYT/
├── theinterface/
│   ├── webapp_backend/          # Flask backend
│   │   ├── server.py           # Main server file
│   │   ├── transcription.py    # Audio transcription logic
│   │   ├── yt_video_to_text.py # YouTube processing
│   │   ├── requirements.txt    # Python dependencies
│   │   └── .env.template       # Environment template
│   └── webapp_frontend/         # React frontend
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── firebase/       # Firebase config
│       │   └── supabase/       # Supabase config
│       ├── public/            # Static assets
│       ├── package.json       # Node dependencies
│       └── .env.template      # Environment template
└── README.md
```

## Security Notes

- Never commit `.env` files to version control
- Use environment-specific configuration files
- Rotate API keys regularly
- Use service account keys (not personal keys) for Google Cloud
- Enable appropriate CORS settings for production

## Troubleshooting

### Common Issues

1. **"No module named 'xyz'"**: Install missing dependencies with `pip install -r requirements.txt`
2. **CORS errors**: Ensure Flask-CORS is properly configured
3. **API key errors**: Verify all environment variables are set correctly
4. **Google Cloud authentication**: Ensure credentials file path is correct

### Debug Mode

Enable debug logging by setting environment variables:
```bash
export FLASK_DEBUG=1  # Backend debugging
export REACT_APP_DEBUG=true  # Frontend debugging
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create a Pull Request

##  Support

For issues and questions:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information

---

**Note**: This application processes YouTube content. Ensure compliance with YouTube's Terms of Service and applicable copyright laws when using this software.
