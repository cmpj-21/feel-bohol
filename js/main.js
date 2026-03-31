document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Dark Mode Toggle ---
  const toggleBtn = document.getElementById('theme-toggle');
  let currentTheme = localStorage.getItem('theme') || 'dark';
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
  
  applyTheme(currentTheme);
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
    });
  }

  // --- 2. Mobile Hamburger Menu ---
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const siteNav = document.getElementById('site-nav');
  
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      siteNav.classList.toggle('is-open');
      const isOpen = siteNav.classList.contains('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!siteNav.contains(e.target) && !menuToggle.contains(e.target)) {
        siteNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --- 3. Expanding Search Bar ---
  const searchContainer = document.getElementById('search-container');
  const searchToggle = document.getElementById('search-toggle');
  const searchInput = document.getElementById('search-input');

  if (searchToggle && searchContainer && searchInput) {
    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      searchContainer.classList.toggle('is-active');
      if (searchContainer.classList.contains('is-active')) {
        searchInput.focus();
      }
    });

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchContainer.contains(e.target)) {
        searchContainer.classList.remove('is-active');
      }
    });

    // Handle Search Action (Enter key)
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim() !== "") {
        console.log("Searching for:", searchInput.value);
        // Simulate search
        searchContainer.classList.remove('is-active');
        searchInput.value = "";
      }
    });
  }

  // --- 4. Back to Top Button ---
  const bttButton = document.getElementById('back-to-top');
  
  if (bttButton) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        bttButton.classList.add('is-visible');
      } else {
        bttButton.classList.remove('is-visible');
      }
    });

    bttButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- 5. Force Video Autoplay ---
  function initVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.muted = true;
      video.setAttribute('muted', ''); // ensure redundancy
      video.play().catch(error => {
        console.warn("Autoplay was blocked by browser. Video will start on first interaction.", error);
        // Fallback: Start on any click
        document.addEventListener('click', () => {
          video.play();
        }, { once: true });
      });
    });
  }


  initVideos();

  // --- 6. Search Service Implementation ---
  const searchIndex = [
    // --- Core Pages ---
    { title: "Home", url: "index.html", keywords: "bohol, welcome, hills, river, motion, cinematic reel, islands" },
    { title: "Destinations", url: "destinations.html", keywords: "chocolate hills, panglao island, loboc river, cadapdapan rice terraces, can-umantad falls, binabaje hills, lamanoc island, abatan river, virgin island, hidden gems, off the beaten path" },
    { title: "Top Attractions", url: "top_attractions.html", keywords: "major attractions, chocolate hills aerial, philippine tarsier, loboc river cruise, bilar manmade forest, hinagdanan cave, balicasag island, alona beach, baclayon church, landmarks" },
    { title: "Local Experience", url: "local_experiences.html", keywords: "heart of bohol, river life, peanut kisses, boholano calamay, sikwate hot chocolate, sandugo festival, basket weaving, tradition, flavors, culture" },
    { title: "Gallery", url: "gallery.html", keywords: "photo gallery, landscapes, scenery, wildlife, sea, beach, culture, heritage, history, drone views, aerial view, tarsier, turtle, diving" },
    { title: "Plan Your Trip", url: "plan_your_trip.html", keywords: "trip planning, best season, itinerary, budget, packing tips, calculator, weather, help" },
    { title: "About Bohol", url: "about.html", keywords: "history, mission, non-profit, educational project, ra 8293" },
    { title: "Contact Us", url: "contact.html", keywords: "email, reach out, hello, help" },
    { title: "Map Explorer", url: "explore_map.html", keywords: "interactive map, locations, find destinations, navigation" },

    // --- Specific Landmarks & Photos ---
    { title: "Chocolate Hills", url: "top_attractions.html", keywords: "geological wonder, carmen, batuan, sagbayan, unesco" },
    { title: "Philippine Tarsier", url: "top_attractions.html", keywords: "wildlife, primate, corella, sanctuary, ethical" },
    { title: "Panglao Island", url: "destinations.html", keywords: "beach capital, alona, dumaluan, diving, balicasag" },
    { title: "Loboc River Cruise", url: "local_experiences.html", keywords: "floating restaurant, emerald river, lunch, music" },
    { title: "Bilar Manmade Forest", url: "top_attractions.html", keywords: "mahogany trees, tunnel effect, nature, photo" },
    { title: "Hinagdanan Cave", url: "gallery.html", keywords: "limestone, underground lagoon, swimming, dauis" },
    { title: "Balicasag Island", url: "top_attractions.html", keywords: "marine sanctuary, sea turtles, diving, snorkel" },
    { title: "Baclayon Church", url: "gallery.html", keywords: "oldest stone church, jesuit, 1596, heritage" },
    { title: "Cadapdapan Rice Terraces", url: "destinations.html", keywords: "candijay, scenery, waterfall, green paddies" },
    { title: "Sandugo Festival", url: "local_experiences.html", keywords: "blood compact, tagbilaran, july, street dancing" },
    { title: "Peanut Kisses", url: "local_experiences.html", keywords: "delicacy, souvenir, cookies, food" },
    { title: "Boholano Calamay", url: "local_experiences.html", keywords: "sticky sweet, coconut shell, food, gift" },
    { title: "Sikwate (Hot Chocolate)", url: "local_experiences.html", keywords: "tablea, cacao, tradition, drink" },
    { title: "Basket Weaving", url: "local_experiences.html", keywords: "antequera, craft, tradition, bamboo" }
  ];

  const resultsDropdown = document.createElement('div');
  resultsDropdown.id = 'search-results';
  resultsDropdown.className = 'search-results-dropdown';
  searchContainer.appendChild(resultsDropdown);

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    resultsDropdown.innerHTML = "";
    
    if (query.length < 2) {
      resultsDropdown.classList.remove('is-visible');
      return;
    }

    const matches = searchIndex.filter(page => 
      page.title.toLowerCase().includes(query) || 
      page.keywords.toLowerCase().includes(query)
    );

    if (matches.length > 0) {
      matches.forEach(page => {
        const item = document.createElement('a');
        item.href = page.url;
        item.className = 'search-result-item';
        item.textContent = page.title;
        resultsDropdown.appendChild(item);
      });
      resultsDropdown.classList.add('is-visible');
    } else {
      resultsDropdown.classList.remove('is-visible');
    }
  }

  searchInput.addEventListener('input', performSearch);

  // Close search on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchContainer.classList.remove('is-active');
      resultsDropdown.classList.remove('is-visible');
    }
  });

  // --- 7. Weather Service Mock (Restored) ---
  const localTemp = document.getElementById('local-temp');
  const localStatus = document.getElementById('local-status');

  if (localTemp && localStatus) {
    setTimeout(() => {
      localTemp.textContent = '76°F / 24°C';
      localStatus.innerHTML = 'Sunny <span class="weather-icon">☀️</span>';
      console.log("Local weather synchronized.");
    }, 2500);
  }
});

