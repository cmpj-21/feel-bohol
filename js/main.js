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

  // --- 6. Weather Service Mock ---
  const localTemp = document.getElementById('local-temp');
  const localStatus = document.getElementById('local-status');

  if (localTemp && localStatus) {
    setTimeout(() => {
      // Mocking a successful detection
      localTemp.textContent = '76°F / 24°C';
      localStatus.innerHTML = 'Sunny <span class="weather-icon">☀️</span>';
      console.log("Local weather synchronized.");
    }, 2500);
  }
});

