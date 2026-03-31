document.addEventListener('DOMContentLoaded', () => {
  const isTripPlannerPage = document.body.dataset.page === 'trip-planner';
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
    let isBackToTopTicking = false;

    function updateBackToTopVisibility() {
      isBackToTopTicking = false;

      if (window.scrollY > 400) {
        bttButton.classList.add('is-visible');
      } else {
        bttButton.classList.remove('is-visible');
      }
    }

    function requestBackToTopUpdate() {
      if (isBackToTopTicking) {
        return;
      }

      isBackToTopTicking = true;
      window.requestAnimationFrame(updateBackToTopVisibility);
    }

    window.addEventListener('scroll', requestBackToTopUpdate, { passive: true });
    requestBackToTopUpdate();

    bttButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- 5. Force Video Autoplay ---
  function initVideos() {
    const videos = Array.from(document.querySelectorAll('video'));

    if (!videos.length) {
      return;
    }

    const hasIntersectionObserver = 'IntersectionObserver' in window;
    const videoControllers = new WeakMap();
    const eagerLoadObserver = hasIntersectionObserver
      ? new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              return;
            }

            const controller = videoControllers.get(entry.target);

            if (controller) {
              controller.activate();
            }

            observer.unobserve(entry.target);
          });
        }, { rootMargin: '900px 0px' })
      : null;
    const playbackObserver = hasIntersectionObserver
      ? new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const controller = videoControllers.get(entry.target);

            if (controller) {
              controller.syncPlayback(entry.isIntersecting && entry.intersectionRatio > 0.12);
            }
          });
        }, { threshold: [0, 0.12, 0.6] })
      : null;

    videos.forEach(video => {
      const configuredStartTime = Number.parseFloat(video.dataset.startTime || '0');
      const hasCustomStartTime = Number.isFinite(configuredStartTime) && configuredStartTime > 0;
      const activePreload = video.dataset.activePreload || 'metadata';
      const sourceCandidates = [
        ...(video.dataset.sources || '').split(','),
        video.getAttribute('src') || '',
        ...Array.from(video.querySelectorAll('source')).map(source => source.getAttribute('src') || '')
      ]
        .map(source => source.trim())
        .filter(Boolean)
        .filter((source, index, allSources) => allSources.indexOf(source) === index);

      let activeSourceIndex = -1;
      let interactionFallbackAttached = false;
      let hasInitializedSource = false;
      let shouldPlayWhenVisible = !hasIntersectionObserver;

      function getStartTime() {
        if (!hasCustomStartTime || !Number.isFinite(video.duration) || video.duration <= 0) {
          return 0;
        }

        return Math.min(configuredStartTime, Math.max(video.duration - 0.1, 0));
      }

      function syncVideoSource(source) {
        const primarySource = video.querySelector('source');
        hasInitializedSource = true;
        video.preload = activePreload;
        video.setAttribute('preload', activePreload);
        video.setAttribute('src', source);

        if (primarySource) {
          primarySource.setAttribute('src', source);
        }

        video.load();
      }

      function tryNextSource() {
        activeSourceIndex += 1;

        if (activeSourceIndex >= sourceCandidates.length) {
          console.warn('No playable video source was found for this element.', video);
          return false;
        }

        syncVideoSource(sourceCandidates[activeSourceIndex]);
        return true;
      }

      function ensureSourceIsReady() {
        if (hasInitializedSource) {
          return true;
        }

        return tryNextSource();
      }

      function seekToStartTime() {
        const startTime = getStartTime();

        if (startTime > 0 && Math.abs(video.currentTime - startTime) > 0.25) {
          video.currentTime = startTime;
        }
      }

      function addInteractionFallback() {
        if (interactionFallbackAttached) {
          return;
        }

        interactionFallbackAttached = true;
        document.addEventListener('click', () => {
          ensureSourceIsReady();
          seekToStartTime();
          video.play();
        }, { once: true });
      }

      function attemptPlayback() {
        if (!ensureSourceIsReady() || document.visibilityState === 'hidden') {
          return;
        }

        video.play().catch(error => {
          console.warn("Autoplay was blocked by browser. Video will start on first interaction.", error);
          addInteractionFallback();
        });
      }

      function syncPlaybackState(shouldPlay) {
        shouldPlayWhenVisible = shouldPlay;

        if (!shouldPlay || document.visibilityState === 'hidden') {
          if (!video.paused) {
            video.pause();
          }

          return;
        }

        attemptPlayback();
      }

      video.muted = true;
      video.setAttribute('muted', ''); // ensure redundancy
      video.preload = 'none';
      video.setAttribute('preload', 'none');

      if (hasCustomStartTime && video.loop) {
        // Native loop always restarts from 0, so we manage looping manually when an intro skip is configured.
        video.loop = false;
        video.removeAttribute('loop');
        video.addEventListener('ended', () => {
          seekToStartTime();

          if (shouldPlayWhenVisible) {
            attemptPlayback();
          }
        });
      }

      video.addEventListener('loadedmetadata', () => {
        seekToStartTime();
      });

      video.addEventListener('error', () => {
        const failedSource = sourceCandidates[activeSourceIndex] || video.currentSrc || video.getAttribute('src');
        console.warn('Video source failed to load. Trying the next available file.', failedSource);
        const hasReplacement = tryNextSource();

        if (hasReplacement && shouldPlayWhenVisible) {
          attemptPlayback();
        }
      });

      const controller = {
        activate() {
          ensureSourceIsReady();
        },
        syncPlayback(shouldPlay) {
          syncPlaybackState(shouldPlay);
        },
        syncVisibility() {
          if (document.visibilityState === 'hidden') {
            if (!video.paused) {
              video.pause();
            }

            return;
          }

          if (shouldPlayWhenVisible) {
            attemptPlayback();
          }
        }
      };

      videoControllers.set(video, controller);

      if (eagerLoadObserver && playbackObserver) {
        eagerLoadObserver.observe(video);
        playbackObserver.observe(video);
      } else {
        controller.activate();
        controller.syncPlayback(true);
      }
    });

    document.addEventListener('visibilitychange', () => {
      videos.forEach(video => {
        const controller = videoControllers.get(video);

        if (controller) {
          controller.syncVisibility();
        }
      });
    });
  }

  // --- 6. Immersive Video Scroll Motion ---
  function initImmersiveVideoMotion() {
    const sections = document.querySelectorAll('.immersive-video-section');

    if (!sections.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isTicking = false;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function applyReducedMotionState() {
      sections.forEach(section => {
        section.style.setProperty('--immersive-scale', '1');
        section.style.setProperty('--immersive-shift', '0px');
        section.style.setProperty('--immersive-opacity', '1');
        section.style.setProperty('--immersive-veil', '0.28');
        section.style.setProperty('--immersive-brightness', '1');
        section.style.setProperty('--immersive-saturation', '1');
        section.style.setProperty('--immersive-contrast', '1');
      });
    }

    function updateMotion() {
      isTicking = false;

      if (prefersReducedMotion.matches) {
        applyReducedMotionState();
        return;
      }

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const travel = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height), 0, 1);
        const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
        const visibility = clamp(visibleHeight / Math.min(rect.height, viewportHeight), 0, 1);
        const focus = 1 - clamp(Math.abs(travel - 0.48) / 0.48, 0, 1);

        const shift = ((0.5 - travel) * 72).toFixed(2);
        const scale = (1.12 - focus * 0.12).toFixed(4);
        const opacity = (0.74 + focus * 0.26).toFixed(3);
        const veil = (0.44 - focus * 0.18 + (1 - visibility) * 0.08).toFixed(3);
        const brightness = (0.82 + focus * 0.18).toFixed(3);
        const saturation = (0.96 + focus * 0.12).toFixed(3);
        const contrast = (1.02 + focus * 0.05).toFixed(3);

        section.style.setProperty('--immersive-shift', `${shift}px`);
        section.style.setProperty('--immersive-scale', scale);
        section.style.setProperty('--immersive-opacity', opacity);
        section.style.setProperty('--immersive-veil', veil);
        section.style.setProperty('--immersive-brightness', brightness);
        section.style.setProperty('--immersive-saturation', saturation);
        section.style.setProperty('--immersive-contrast', contrast);
      });
    }

    function requestMotionUpdate() {
      if (isTicking) {
        return;
      }

      isTicking = true;
      window.requestAnimationFrame(updateMotion);
    }

    requestMotionUpdate();
    window.addEventListener('scroll', requestMotionUpdate, { passive: true });
    window.addEventListener('resize', requestMotionUpdate);

    if (typeof prefersReducedMotion.addEventListener === 'function') {
      prefersReducedMotion.addEventListener('change', requestMotionUpdate);
    } else if (typeof prefersReducedMotion.addListener === 'function') {
      prefersReducedMotion.addListener(requestMotionUpdate);
    }
  }


  initVideos();
  initImmersiveVideoMotion();

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

  // --- 7. Weather Service Mock ---
  const localTemp = document.getElementById('local-temp');
  const localStatus = document.getElementById('local-status');

  if (!isTripPlannerPage && localTemp && localStatus) {
    setTimeout(() => {
      localTemp.textContent = '76°F / 24°C';
      localStatus.innerHTML = 'Sunny <span class="weather-icon">☀️</span>';
      console.log("Local weather synchronized.");
    }, 2500);
  }

  // --- 8. Gallery Lightbox Logic ---
  const lightbox = document.getElementById('gallery-lightbox');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox__close');
  const lightboxOverlay = document.querySelector('.lightbox__overlay');

  if (lightbox && galleryItems.length > 0) {
    const openLightbox = (item) => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery-item__caption');
      
      if (!img) return;

      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || "Bohol Gallery Image";
      lightboxCaption.textContent = caption ? caption.textContent : "";
      
      lightbox.classList.add('is-visible');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // Lock scroll
    };

    const closeLightbox = () => {
      lightbox.classList.remove('is-visible');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; // Restore scroll
      
      // Delay cleaning src to avoid flash during transition
      setTimeout(() => {
        if (!lightbox.classList.contains('is-visible')) {
          lightboxImg.src = "";
        }
      }, 400);
    };

    galleryItems.forEach(item => {
      item.style.cursor = 'zoom-in';
      item.addEventListener('click', () => openLightbox(item));
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxOverlay) lightboxOverlay.addEventListener('click', closeLightbox);

    // Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-visible')) {
        closeLightbox();
      }
    });
  }
});
