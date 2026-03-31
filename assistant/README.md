# Feel Bohol AI Chat Assistant

An AI-powered chat assistant that helps visitors navigate the Feel Bohol tourism website and discover Bohol, Philippines.

## Features

- **Website Navigation**: The assistant knows all pages and can guide users to relevant content
- **Bohol Expertise**: Comprehensive knowledge about attractions, food, culture, and travel tips
- **Context-Aware**: Maintains conversation history for natural dialogue
- **Quick Suggestions**: Pre-built questions for common queries
- **Responsive UI**: Works on desktop and mobile devices

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Install Python dependencies**:
   ```bash
   cd assistant
   pip install -r requirements.txt
   ```

2. **Verify your API key**:
   The `.env` file should already contain your Groq API key:
   ```
   GROQ_API_KEY=your_api_key_here
   ```

3. **Start the assistant server**:
   ```bash
   python app.py
   ```
   
   The server will start on `http://localhost:5000`

4. **Open the website**:
   Open any page of the Feel Bohol website in your browser. You should see a chat button in the bottom-right corner.

## Usage

### Chat Widget

- Click the chat icon (💬) in the bottom-right corner of any page
- Type your question about Bohol or click one of the quick suggestions
- The assistant will respond with helpful information and suggest relevant pages to visit

### Example Questions

- "What are the top attractions in Bohol?"
- "How do I get to Chocolate Hills?"
- "What's the best time to visit?"
- "Tell me about local food"
- "What is the Sandugo Festival?"
- "How much does a trip to Bohol cost?"

### Quick Suggestions

The chat widget provides quick suggestion buttons:
- Top attractions
- Chocolate Hills
- Best time to visit
- Local food

## API Reference

### POST /api/chat

Send a chat message and receive an AI response.

**Request Body:**
```json
{
  "message": "What are the top attractions?",
  "conversation_history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Mabuhay! Welcome to Feel Bohol..."}
  ]
}
```

**Response:**
```json
{
  "response": "Here are the top attractions in Bohol...",
  "success": true
}
```

### GET /api/health

Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "Feel Bohol Chat Assistant"
}
```

## Architecture

```
assistant/
├── app.py              # Flask backend API
├── .env                # Environment variables (API keys)
├── requirements.txt    # Python dependencies
└── README.md          # This file

Frontend (in main project):
├── css/chat.css       # Chat widget styles
└── js/chat.js         # Chat widget JavaScript
```

## Technology Stack

- **Backend**: Flask (Python)
- **AI Model**: Llama 3.3 70B via Groq API
- **Frontend**: Vanilla JavaScript
- **CORS**: Enabled for cross-origin requests

## Troubleshooting

### Chat not connecting?

1. Make sure the Python server is running (`python app.py`)
2. Check that the API URL in `js/chat.js` matches your server address
3. Verify your Groq API key is correct in `.env`

### API errors?

- Check your Groq API key is valid
- Ensure you have internet connectivity
- Check the console for detailed error messages

## License

This is part of the Feel Bohol non-profit educational project.