"""
Feel Bohol - AI Chat Assistant API
A Flask-based chat assistant that helps users navigate the Feel Bohol tourism website.
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize Groq client
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env file")

client = Groq(api_key=api_key)

# Website site map and navigation structure
WEBSITE_STRUCTURE = {
    "pages": {
        "index.html": {
            "name": "Home",
            "description": "Main landing page featuring a carousel of Bohol's top destinations (Chocolate Hills, Bilar Manmade Forest, Loboc River, Philippine Tarsier) with cinematic video overview.",
            "url": "index.html",
            "key_features": ["Hero carousel", "Cinematic video", "Featured destinations"]
        },
        "destinations.html": {
            "name": "Destinations",
            "description": "Comprehensive guide to all Bohol destinations including iconic spots (Chocolate Hills, Panglao Island, Loboc River) and hidden gems (Cadapdapan Rice Terraces, Can-umantad Falls, Binabaje Hills, Lamanoc Island, Abatan River Firefly Tour, Virgin Island). Also includes Bohol's festival calendar.",
            "url": "destinations.html",
            "key_features": ["Iconic destinations", "Hidden gems", "Festival calendar"]
        },
        "top_attractions.html": {
            "name": "Top Attractions",
            "description": "Detailed guide to Bohol's major attractions with entrance fees. Includes Chocolate Hills (₱100-₱150), Philippine Tarsier Sanctuary (₱150-₱170), Loboc River Cruise (₱850-₱1,000), Bilar Manmade Forest (Free), Hinagdanan Cave (₱75-₱150), Balicasag Island, Alona Beach, Baclayon Church (₱50-₱150), and Cadapdapan Rice Terraces (Free).",
            "url": "top_attractions.html",
            "key_features": ["Major landmarks", "Entrance fees", "Detailed descriptions"]
        },
        "local_experiences.html": {
            "name": "Local Experiences",
            "description": "Immersive cultural experiences including Loboc River Experience video, traditional foods (Peanut Kisses, Boholano Calamay, Sikwate hot chocolate), and heritage (Sandugo Festival, Antequera Basket Weaving).",
            "url": "local_experiences.html",
            "key_features": ["Food & flavors", "Festivals & culture", "Traditional crafts"]
        },
        "gallery.html": {
            "name": "Gallery",
            "description": "Photo gallery showcasing Bohol's stunning landscapes, wildlife, and cultural sites.",
            "url": "gallery.html",
            "key_features": ["Photo collection", "Visual showcase"]
        },
        "explore_map.html": {
            "name": "Interactive Map",
            "description": "Interactive map showing all major destinations and attractions across Bohol with locations and navigation.",
            "url": "explore_map.html",
            "key_features": ["Interactive map", "Location markers", "Navigation aid"]
        },
        "plan_your_trip.html": {
            "name": "Trip Planner",
            "description": "Complete trip planning guide including best seasons to visit (Peak: Dec-May, Value: Jun-Nov), sample 3-7 day itineraries, budget calculator (₱2,500-₱20,000/day), packing tips, and weather widget. Includes detailed daily cost breakdown for accommodations, transportation, activities, and meals.",
            "url": "plan_your_trip.html",
            "key_features": ["Seasonal guide", "Sample itineraries", "Budget calculator", "Packing tips"]
        },
        "about.html": {
            "name": "About Bohol",
            "description": "Rich history and cultural background including the Sandugo Blood Compact (1565), Francisco Dagohoy's 85-year rebellion (1744-1829), Baclayon Church history (built 1596-1727), and why Bohol is unique.",
            "url": "about.html",
            "key_features": ["Historical background", "Cultural heritage", "Why visit Bohol"]
        },
        "contact.html": {
            "name": "Contact",
            "description": "Contact information and inquiry form for the Feel Bohol project.",
            "url": "contact.html",
            "key_features": ["Contact form", "Email: hello@feelbohol.ph"]
        }
    },
    "attractions": {
        "Chocolate Hills": {
            "page": "top_attractions.html",
            "description": "Over 1,200 cone-shaped limestone hills that turn chocolate-brown in dry season. Located in Carmen, Batuan, and Sagbayan.",
            "fee": "₱100 – ₱150"
        },
        "Philippine Tarsier Sanctuary": {
            "page": "top_attractions.html",
            "description": "Ethical sanctuary in Corella for one of the world's smallest primates. Silence and 2-metre distance required.",
            "fee": "₱150 – ₱170"
        },
        "Loboc River Cruise": {
            "page": "top_attractions.html",
            "description": "1.5-hour floating restaurant cruise through jungle canopies with Filipino buffet and cultural performances.",
            "fee": "₱850 – ₱1,000"
        },
        "Bilar Manmade Forest": {
            "page": "top_attractions.html",
            "description": "2-kilometre stretch of dense mahogany trees creating a dramatic tunnel effect along the highway.",
            "fee": "Free"
        },
        "Alona Beach": {
            "page": "top_attractions.html",
            "description": "1.5-km strip of white sand in Panglao, lined with resorts, restaurants, and dive shops.",
            "fee": "Free (beach access)"
        },
        "Balicasag Island": {
            "page": "top_attractions.html",
            "description": "World-renowned marine sanctuary with sea turtles, coral walls, and abundant reef fish.",
            "fee": "₱250 env. fee + boat fare"
        },
        "Hinagdanan Cave": {
            "page": "top_attractions.html",
            "description": "Limestone cave in Dauis, Panglao with underground lagoon for swimming.",
            "fee": "₱75 entrance / ₱150 with swim"
        },
        "Baclayon Church": {
            "page": "top_attractions.html",
            "description": "One of the oldest stone churches in the Philippines (built 1596), made of coral stones bound with egg whites.",
            "fee": "₱50 – ₱150 museum fee"
        },
        "Panglao Island": {
            "page": "destinations.html",
            "description": "Bohol's beach capital featuring Alona Beach, Dumaluan Beach, world-class dive sites, and Balicasag marine sanctuary."
        },
        "Sandugo Festival": {
            "page": "destinations.html",
            "description": "Month-long July celebration in Tagbilaran City commemorating the 1565 Blood Compact. Features street dancing, pageants, and cultural exhibits."
        }
    },
    "food": {
        "Peanut Kisses": {
            "page": "local_experiences.html",
            "description": "Signature cookies inspired by Chocolate Hills, made from peanuts and egg whites."
        },
        "Boholano Calamay": {
            "page": "local_experiences.html",
            "description": "Sticky sweet delicacy made from glutinous rice, coconut milk, and sugar, served in coconut shell."
        },
        "Sikwate": {
            "page": "local_experiences.html",
            "description": "Pure Boholano cacao tablets melted into rich dark hot chocolate, paired with Puto Maya."
        }
    },
    "hidden_gems": {
        "Cadapdapan Rice Terraces": {
            "page": "destinations.html",
            "description": "Scenic rice terraces in Candijay with waterfall backdrop. A peaceful alternative to northern terraces.",
            "fee": "Free"
        },
        "Can-umantad Falls": {
            "page": "destinations.html",
            "description": "Bohol's tallest waterfall in Candijay — 10-metre-wide curtain falling into emerald pool.",
            "fee": "Free"
        },
        "Binabaje Hills": {
            "page": "destinations.html",
            "description": "'Little Switzerland' in Alicia — ridgeline with sweeping mountain panoramas.",
            "fee": "Free"
        },
        "Lamanoc Island": {
            "page": "destinations.html",
            "description": "Mystical islet in Anda with pre-colonial burial caves and ancient rock art.",
            "fee": "Free"
        },
        "Abatan River Firefly Tour": {
            "page": "destinations.html",
            "description": "Nighttime banca ride through mangrove forests illuminated by wild fireflies.",
            "fee": "Varies by tour operator"
        },
        "Virgin Island": {
            "page": "destinations.html",
            "description": "Tiny sandbar island near Panglao with dazzling white sand and shallow turquoise water.",
            "fee": "Boat fare required"
        }
    }
}

# System prompt for the AI assistant
SYSTEM_PROMPT = f"""You are the Feel Bohol AI Tourist Assistant, a friendly and knowledgeable guide for the Feel Bohol tourism website. Your purpose is to help visitors explore Bohol, Philippines by providing information and navigation assistance.

WEBSITE STRUCTURE:
{json.dumps(WEBSITE_STRUCTURE, indent=2)}

GUIDELINES:
1. **Navigation Assistance**: When users ask about specific topics, recommend the most relevant page(s) and provide the URL. For example:
   - General destinations → destinations.html
   - Specific attractions with fees → top_attractions.html
   - Cultural experiences and food → local_experiences.html
   - Trip planning and budgets → plan_your_trip.html
   - History and background → about.html
   - Visual exploration → gallery.html or explore_map.html

2. **Bohol Expertise**: You have comprehensive knowledge about:
   - All major attractions (Chocolate Hills, Tarsier Sanctuary, Loboc River, etc.)
   - Hidden gems (Cadapdapan Rice Terraces, Can-umantad Falls, etc.)
   - Local food and culture (Peanut Kisses, Calamay, Sikwate, Sandugo Festival)
   - Practical information (entrance fees, best seasons, itineraries, budgets)
   - History (Sandugo Blood Compact, Dagohoy Rebellion, Baclayon Church)

3. **Response Style**:
   - Be warm, welcoming, and enthusiastic about Bohol
   - Provide concise but informative answers
   - Always suggest relevant pages to visit on the website
   - Use markdown formatting for readability (bold, lists, etc.)
   - Include practical details like prices (₱) and locations when relevant
   - Keep responses focused and helpful

4. **Limitations**:
   - You can only provide information available on the Feel Bohol website
   - For specific inquiries beyond the website content, direct users to contact.html
   - Contact email: hello@feelbohol.ph

5. **Special Features to Mention**:
   - Budget calculator on plan_your_trip.html
   - Interactive map on explore_map.html
   - Weather widget on plan_your_trip.html
   - Photo gallery on gallery.html

Remember: You're helping people discover the magic of Bohol, Philippines!"""


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Handle chat requests from the frontend.
    Expects JSON with 'message' and optional 'conversation_history'.
    Returns AI-generated response with navigation suggestions.
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        conversation_history = data.get('conversation_history', [])

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Build messages for Groq API
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]

        # Add conversation history (last 10 messages to stay within token limits)
        for msg in conversation_history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Call Groq API
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Using Llama 3.3 via Groq
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1.0,
            stream=False
        )

        assistant_response = response.choices[0].message.content

        return jsonify({
            'response': assistant_response,
            'success': True
        })

    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'service': 'Feel Bohol Chat Assistant'})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)