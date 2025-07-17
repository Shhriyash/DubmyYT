# Tunneling Setup Instructions (Windows)

When you want to access your DubMyYT application from other devices (phones, tablets, other computers), you need to make your local server accessible over the internet using tunneling.

## Step 1: Start Your Servers

First, make sure both your backend and frontend servers are running:

### Backend (PowerShell Terminal 1):
```powershell
cd theinterface\webapp_backend
python server.py
```

### Frontend (PowerShell Terminal 2):
```powershell
cd theinterface\webapp_frontend
npm start
```

## Step 2: Set Up Tunneling

### Option A: Using ngrok (Recommended)

1. **Install ngrok for Windows:**
   - Download from https://ngrok.com/download
   - Download the Windows ZIP file
   - Extract `ngrok.exe` to a folder (e.g., `C:\ngrok\`)
   - Add the folder to your Windows PATH:
     - Press `Win + R`, type `sysdm.cpl`, press Enter
     - Go to "Advanced" tab → "Environment Variables"
     - Under "System Variables", find "Path" and click "Edit"
     - Click "New" and add the path to ngrok (e.g., `C:\ngrok\`)
     - Click "OK" to save
   - Or run ngrok directly from the extracted folder

2. **Important**: ngrok free version only allows **one tunnel at a time**

3. **Choose your approach:**

   **Approach 1: Tunnel Backend Only (Recommended)**
   ```powershell
   # PowerShell Terminal 3:
   ngrok http 5000
   ```
   - Access your app locally at: `http://localhost:3000`
   - Your backend will be available at: `https://abc123.ngrok.io`
   - Other devices can access your local frontend if on same network

   **Approach 2: Tunnel Frontend Only**
   ```powershell
   # PowerShell Terminal 3:
   ngrok http 3000
   ```
   - Frontend accessible at: `https://def456.ngrok.io`
   - Backend must be accessible via local network IP
   - Requires updating API URL to your local IP

4. **Note the tunnel URL:**
   - ngrok will show a URL like: `https://abc123.ngrok.io`

### Option B: Using localtunnel (Multiple Tunnels)

1. **Install localtunnel (requires Node.js):**
   ```powershell
   npm install -g localtunnel
   ```

2. **Advantage**: localtunnel allows multiple simultaneous tunnels

3. **Important**: When using localtunnel for frontend, you'll see WebSocket errors in browser console. These are harmless and don't affect functionality.

4. **Tunnel both servers:**
   ```powershell
   # Try without custom subdomain first (more reliable)
   # PowerShell Terminal 3 (Backend)
   lt --port 5000
   
   # PowerShell Terminal 4 (Frontend)  
   lt --port 3000
   
   # If the above works, you can try with custom subdomain
   # lt --port 5000 --subdomain dubmyyt-api
   # lt --port 3000 --subdomain dubmyyt-app
   ```
   
   **Note**: If you get "connection refused" errors, localtunnel servers may be down. Use ngrok instead.

5. **Expected browser console warnings** (can be ignored):
   - `Firefox can't establish a connection to the server at wss://dubmyyt-app.loca.lt:3000/ws`
   - `Cookie "PREF" has been rejected for invalid domain`
   - These don't affect your app's functionality

### Option C: Local Network Access

If devices are on the same Wi-Fi network:

1. **Find your computer's IP address:**
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. **Access from other devices:**
   - Frontend: `http://YOUR-IP:3000` (e.g., `http://192.168.1.100:3000`)
   - Backend: `http://YOUR-IP:5000` (e.g., `http://192.168.1.100:5000`)

## Step 3: Configure the API URL

### If using Approach 1 (Backend tunnel only):

Edit `theinterface\webapp_frontend\.env` and add:
```
REACT_APP_API_URL=https://your-backend-tunnel-url.ngrok.io
```

For example:
```
REACT_APP_API_URL=https://abc123.ngrok.io
```

### If using Approach 2 (Frontend tunnel only):

Edit `theinterface\webapp_frontend\.env` and add your local IP:
```
REACT_APP_API_URL=http://YOUR-LOCAL-IP:5000
```

For example:
```
REACT_APP_API_URL=http://192.168.1.100:5000
```

### If using localtunnel (both tunneled):

Edit `theinterface\webapp_frontend\.env` and add:
```
REACT_APP_API_URL=https://dubmyyt-api.loca.lt
```

Then restart your frontend server in PowerShell:
```powershell
# Stop the current server with Ctrl+C, then:
npm start
```

### Method 2: Automatic Detection

The app will automatically try to detect the correct API URL, but setting the environment variable is more reliable.

## Step 4: Access from Other Devices

### Approach 1 (Backend tunnel only):
- **Your device**: `http://localhost:3000`
- **Other devices on same network**: `http://YOUR-LOCAL-IP:3000`
- **Any device via internet**: Not directly accessible (backend only tunneled)

### Approach 2 (Frontend tunnel only):
- **Any device**: `https://def456.ngrok.io`
- **Requires**: Backend accessible via local network IP

### Localtunnel (both tunneled):
- **Any device**: `https://dubmyyt-app.loca.lt`

### Local network only:
- **Any device on same Wi-Fi**: `http://YOUR-LOCAL-IP:3000`

## Troubleshooting

### If you see "Network Error" or "CORS Error":

1. **Check server logs** in your PowerShell terminals for CORS-related messages
2. **Verify the API URL** in browser console (look for debug logs)
3. **Try refreshing** the page after setting environment variables
4. **Check that both tunnels are active** and accessible
5. **Windows Firewall**: Make sure Windows Firewall isn't blocking the connections

### If history items don't load:

1. **Check browser console** for specific error messages (Press F12 → Console tab)
2. **Verify the backend tunnel URL** is accessible by visiting it directly
3. **Ensure X-User-Id header** is being sent (check Network tab in dev tools)

### Windows-Specific Issues:

- **"ngrok command not found"**: Make sure ngrok.exe is in your PATH or run it from the extracted folder
- **Permission errors**: Run PowerShell as Administrator if needed
- **Port already in use**: Check if other applications are using ports 3000 or 5000
- **Antivirus blocking**: Some antivirus software may block tunneling - add exceptions if needed

### Localtunnel-Specific Issues:

- **WebSocket errors in console**: When using localtunnel for frontend, you'll see WebSocket connection errors like:
  - `Firefox can't establish a connection to the server at wss://dubmyyt-app.loca.lt:3000/ws`
  - `Cookie "PREF" has been rejected for invalid domain`
  - **These are normal and can be ignored** - they don't affect your app functionality
- **Hot reloading may not work**: Changes to code might require manual page refresh when using tunneled frontend
- **"connection refused: localtunnel.me:6827"**: Localtunnel servers are having issues
  - **Solution 1**: Try without custom subdomain: `lt --port 5000` (removes --subdomain)
  - **Solution 2**: Try different port for localtunnel: `lt --port 5000 --local-host 127.0.0.1`
  - **Solution 3**: Switch to ngrok (recommended) - more reliable than localtunnel
  - **Solution 4**: Check Windows Firewall and antivirus blocking connections
- **Localtunnel servers down**: Sometimes localtunnel.me service is unavailable
  - **Best solution**: Use ngrok instead - it's more stable and reliable

### YouTube Download Issues:

- **HTTP Error 403: Forbidden**: YouTube is blocking the download due to anti-bot protection
  - **Solution**: Try a different video, wait a few minutes, or use a different YouTube URL
  - Some videos have stricter protection than others
- **"Requested format is not available"**: YouTube changed format restrictions for that video
  - **Solution**: Try a different video or try again later
- **Video unavailable**: Video is private, removed, or region-locked
  - **Solution**: Use a public, available video URL

### Common Issues:

- **"Request failed"**: Usually means the API URL is wrong or backend is unreachable
- **CORS errors**: Should be fixed with the updated server.py configuration
- **Blank video details**: Often a network connectivity issue to the backend

## Testing the Setup

1. **Visit your frontend tunnel URL** in any browser
2. **Log in** to the application  
3. **Try processing a YouTube URL** to test the full flow
4. **Check the browser console** for any error messages (Press F12 → Console)
5. **Test from multiple devices** to ensure tunneling is working

## Windows Quick Start Summary

### Recommended: Backend Tunnel Only (ngrok free)

1. **Open 3 PowerShell windows:**
   - Terminal 1: `cd theinterface\webapp_backend; python server.py`
   - Terminal 2: `cd theinterface\webapp_frontend; npm start`
   - Terminal 3: `ngrok http 5000`

2. **Copy the backend ngrok URL** from terminal 3

3. **Update .env file** with backend tunnel URL:
   ```
   REACT_APP_API_URL=https://abc123.ngrok.io
   ```

4. **Restart frontend** (Ctrl+C then `npm start`)

5. **Access:**
   - **Your computer**: `http://localhost:3000`
   - **Same network devices**: `http://YOUR-LOCAL-IP:3000`

### Alternative: Use localtunnel for full internet access (if working)

**⚠️ Note**: Localtunnel often has connectivity issues. If you get connection errors, use ngrok instead.

1. **Install**: `npm install -g localtunnel`
2. **Try these commands in order until one works:**
   ```powershell
   # Try without custom subdomain first
   lt --port 5000
   lt --port 3000
   
   # If that fails, try with specific host
   lt --port 5000 --local-host 127.0.0.1
   lt --port 3000 --local-host 127.0.0.1
   
   # Original approach (if servers are working)
   lt --port 5000 --subdomain dubmyyt-api
   lt --port 3000 --subdomain dubmyyt-app
   ```
3. **If all fail**: Use ngrok instead - it's more reliable
4. **Note**: You'll see WebSocket errors in browser console - these are harmless and can be ignored

## Security Note

- Tunnel URLs are publicly accessible
- Don't share tunnel URLs with untrusted parties
- Consider using ngrok's authentication features for added security
- Stop tunnels when not needed
