# Feel Bohol: Project Requirements & Implementation Details

This document contains the full extracted content from the project presentation: `Discover_Bohol_Static_HTML_Tourism_Promotion_Website_v2.pptx`.

---
## Group Members

- Puliran, Carlsam
- Tolentino, Anthony Gabriel
- Labisig, Frienzal
- Butuan, Mc Laurence

---
## Project Overview

### Purpose

- Promote tourism and support the local economy.
- Provide complete travel information.
- Highlight Bohol’s natural beauty and cultural heritage.
- Help tourists easily navigate attractions through a visually engaging platform.

### Scope
- Static website developed using **HTML5, CSS3, and JavaScript**.
- Features tourism information, destination images, and travel tips.

### Target Users
- Local and foreign tourists.
- General travelers.

### Supported Platforms
- **Devices:** Desktop, Tablet, Mobile.
- **Browsers:** Chrome, Firefox, Edge, Safari.

## Design System

### Design Style
- **Minimalist:** Emphasizing readability and visual clarity.

### Typography

- **Headings:** [Bree Serif](https://fonts.google.com/specimen/Bree+Serif)
- **Body/Labels:** [Inter](https://fonts.google.com/specimen/Inter) (Light 300, 400, 500, 600, 700)

**Google Fonts Import:**

```css
@import url('https://fonts.googleapis.com/css2?family=Bree+Serif&family=Inter:wght@300;400;500;600;700&display=swap');
```

### Color Palette (Dual-Mode Design)


| UI Role | Light Mode | Dark Mode | Reference |
| :--- | :--- | :--- | :--- |
| **Background** | `#ECECEC` | `#12140F` | Nature / Earth |
| **Surface (Cards/Nav)** | `#FFFFFF` | `#1E2310` | Sage / Olive Variant |
| **Accents (Primary)** | `#84934A` | `#84934A` | Sage Green |
| **Accents (Secondary)** | `#656D3F` | `#656D3F` | Olive Green |
| **Typography (Headings)** | `#492828` | `#ECECEC` | Earth / Light Contrast |
| **Typography (Body)** | `#242424` | `#D1D1D1` | Professional Readability |

**Color Meanings:**
These colors represent the natural beauty of Bohol—forests, chocolate hills, and sandy beaches. Light mode focuses on openness and airiness, while Dark mode creates a premium, deep-nature aesthetic.


## Website Structure & Functional Requirements (FR)

### 1. Home Page (`index.html`)
- **FR-01:** Title "Discover Bohol".
- **FR-02:** Hero banner image.
- **FR-03:** Brief tourism overview.
- **FR-04:** Featured attractions section.
- **FR-05:** Travel tips preview.

### 2. About Page (`about.html`)
- **FR-06:** History, culture, tourism significance.
- **FR-07:** At least 3 descriptive paragraphs.
- **FR-08:** Highlight why Bohol is a popular destination.

### 3. Top Attractions Page (`top_attractions.html`)
- **FR-09:** Major attractions (Chocolate Hills, Panglao, Tarsier, Loboc, Churches).
- **FR-10:** Image + short description for each.
- **FR-11:** Clean, readable layout.

### 4. Gallery Page (`gallery.html`)
- **FR-12:** Tourist spot gallery.
- **FR-13:** At least 9 attraction images.
- **FR-14:** Responsive grid layout.

### 5. Explore Map Page (`explore_map.html`)
- **FR-18:** Show locations of major attractions.
- **FR-19:** Clickable markers or mapped sections.
- **FR-20:** Display attraction name and short location details on click.

### 6. Plan Your Trip Page (`plan_your_trip.html`)
- **FR-22:** Travel planning info.
- **FR-23:** Estimated expenses (Transport, Entrance, Food, Accommodation).
- **FR-24:** Travel tips (Best time to visit, pack list, reminders).
- **FR-25:** Interactive sections (Accordions, cards, or tabs).

### 7. Local Experiences Page (`local_experiences.html`)
- **FR-26:** Featured activities and culture.
- **FR-27:** Local food, heritage, festivals, river cruises, souvenirs.
- **FR-28:** Interactive content cards/reveal sections.

### 8. Contact Page (`contact.html`)
- **FR-29:** Inquiry/Contact info.
- **FR-30:** HTML form (Name, Email, Message).
- **FR-31:** Submit button with visual interaction (Hover effects).
- **FR-32:** Tourism-related contact details.

---

## Non-Functional Requirements (NFR)
- **NFR-01 Usability:** Clear layout/navigation.
- **NFR-02 Performance:** Load time < 3 seconds.
- **NFR-03 Responsiveness:** Mobile-friendly adapter.
- **NFR-04 Accessibility:** Semantic HTML, Alt text, readable fonts.

---

## Project Budget (Estimated)
| Item | Description | Cost (₱) |
| :--- | :--- | :--- |
| Domain | FeelBohol.com | 800 |
| Hosting | Website hosting | 1,500 |
| Design Tools | Adobe tools | 1,200 |
| Image Resources| Unsplash images | 0 |
| Design | UI Planning | 2,000 |
| Development | HTML/CSS/JS | 5,000 |
| Testing | Cross-browser | 1,000 |
| **Total** | | **11,500** |

---

## Timeline (2 Weeks)
- **Week 1:** Asset collection, Branding, HTML structure, CSS Navigation.
- **Week 2:** Gallery, Contact Form, Responsive Testing, Debugging, Final Review.
