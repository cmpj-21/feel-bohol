document.addEventListener('DOMContentLoaded', () => {
  const plannerForm = document.getElementById('trip-planner-form');

  if (!plannerForm) {
    return;
  }

  const BOHOL_COORDS = {
    latitude: 9.8507,
    longitude: 124.1435,
    timezone: 'Asia/Manila'
  };

  const FORECAST_CACHE_KEY = 'feelbohol:planner:bohol-forecast:v1';
  const FORECAST_CACHE_TTL_MS = 30 * 60 * 1000;
  const LOCAL_CACHE_TTL_MS = 10 * 60 * 1000;
  const ROUTE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const MARINE_FORECAST_CACHE_KEY = 'feelbohol:planner:bohol-marine-forecast:v1';
  const MARINE_FORECAST_TTL_MS = 30 * 60 * 1000;
  const OSRM_ROUTE_BASE_URL = 'https://router.project-osrm.org/route/v1/driving/';
  const BALICASAG_COORDS = {
    latitude: 9.5172,
    longitude: 123.6838,
    timezone: 'Asia/Manila'
  };

  const styleProfiles = {
    budget: {
      label: 'Budget',
      accommodationPerNight: 1200,
      foodPerDay: 900,
      miscPerDay: 250,
      activityComfort: 0
    },
    standard: {
      label: 'Standard',
      accommodationPerNight: 3200,
      foodPerDay: 1500,
      miscPerDay: 500,
      activityComfort: 120
    },
    luxury: {
      label: 'Luxury',
      accommodationPerNight: 7800,
      foodPerDay: 3200,
      miscPerDay: 1200,
      activityComfort: 320
    }
  };

  const paceProfiles = {
    relaxed: {
      label: 'Relaxed',
      dailyMinutes: 420,
      firstDayMinutes: 360,
      lastDayMinutes: 360,
      stopScore: { 2: 6, 3: 2, 4: -4, 5: -10 }
    },
    balanced: {
      label: 'Balanced',
      dailyMinutes: 540,
      firstDayMinutes: 480,
      lastDayMinutes: 480,
      stopScore: { 2: 2, 3: 6, 4: 4, 5: 0 }
    },
    packed: {
      label: 'Packed',
      dailyMinutes: 660,
      firstDayMinutes: 600,
      lastDayMinutes: 600,
      stopScore: { 2: -2, 3: 4, 4: 8, 5: 6 }
    }
  };

  const transportProfiles = {
    shared_tour: {
      label: 'Shared tours + tricycles',
      speedKph: 28,
      baseCost: 450,
      perKmCost: 4.5,
      routeDurationMultiplier: 1.28
    },
    scooter: {
      label: 'Scooter',
      speedKph: 34,
      baseCost: 450,
      perKmCost: 1.4,
      routeDurationMultiplier: 1.12
    },
    private_van: {
      label: 'Private van + driver',
      speedKph: 40,
      baseCost: 2500,
      perKmCost: 11.5,
      routeDurationMultiplier: 1.06
    },
    private_car: {
      label: 'Private car',
      speedKph: 38,
      baseCost: 1700,
      perKmCost: 8.5,
      routeDurationMultiplier: 1
    }
  };

  const baseAreas = {
    flexible: { label: 'Flexible / Move Around', lat: 9.6496, lng: 123.8550 },
    panglao: { label: 'Panglao', lat: 9.5780, lng: 123.7440 },
    tagbilaran: { label: 'Tagbilaran', lat: 9.6496, lng: 123.8550 },
    anda: { label: 'Anda', lat: 9.7453, lng: 124.5766 }
  };

  const regionAnchors = {
    central: { lat: 9.6496, lng: 123.8550 },
    panglao: { lat: 9.5780, lng: 123.7440 },
    inland: { lat: 9.7260, lng: 124.0480 },
    east: { lat: 9.9150, lng: 124.4680 },
    anda: { lat: 9.7453, lng: 124.5766 }
  };

  const interestsCopy = {
    nature: 'Nature',
    beaches: 'Beaches',
    wildlife: 'Wildlife',
    culture: 'Culture',
    food: 'Food',
    adventure: 'Adventure'
  };

  const weatherCodeMap = {
    0: { label: 'Clear sky' },
    1: { label: 'Mainly clear' },
    2: { label: 'Partly cloudy' },
    3: { label: 'Overcast' },
    45: { label: 'Foggy' },
    48: { label: 'Foggy' },
    51: { label: 'Light drizzle' },
    53: { label: 'Drizzle' },
    55: { label: 'Heavy drizzle' },
    61: { label: 'Light rain' },
    63: { label: 'Rain' },
    65: { label: 'Heavy rain' },
    80: { label: 'Rain showers' },
    81: { label: 'Showers' },
    82: { label: 'Heavy showers' },
    95: { label: 'Thunderstorm' },
    96: { label: 'Storm with hail' },
    99: { label: 'Severe storm' }
  };

  const placeCatalog = {
    blood_compact: {
      name: 'Blood Compact Shrine',
      lat: 9.6237,
      lng: 123.8754,
      region: 'central',
      category: 'heritage',
      tags: ['culture'],
      durationHours: 1,
      activityCost: 0,
      bestTime: 'Afternoon',
      rainFriendly: true,
      openingHours: '8:00 AM - 5:00 PM',
      openingSource: 'Curated 2026 heritage-site estimate',
      priority: 6,
      description: 'A quick history stop that works well on arrival or on wet-weather backup days.'
    },
    baclayon_church: {
      name: 'Baclayon Church',
      lat: 9.6224,
      lng: 123.9120,
      region: 'central',
      category: 'heritage',
      tags: ['culture'],
      durationHours: 1.25,
      activityCost: 50,
      bestTime: 'Late Morning',
      rainFriendly: true,
      openingHours: '8:00 AM - 5:00 PM',
      openingSource: 'Curated 2026 church-visit estimate',
      priority: 8,
      description: 'One of Bohol\'s strongest heritage anchors and an easy fit with Tagbilaran or Loboc days.'
    },
    dauis_church: {
      name: 'Dauis Church',
      lat: 9.6250,
      lng: 123.8655,
      region: 'central',
      category: 'heritage',
      tags: ['culture'],
      durationHours: 0.75,
      activityCost: 0,
      bestTime: 'Morning',
      rainFriendly: true,
      openingHours: '7:00 AM - 6:00 PM',
      openingSource: 'Curated 2026 church-visit estimate',
      priority: 5,
      description: 'A short heritage stop near the Panglao bridge that keeps rainy-day plans realistic.'
    },
    tagbilaran_food_crawl: {
      name: 'Tagbilaran food crawl',
      lat: 9.6496,
      lng: 123.8550,
      region: 'central',
      category: 'food',
      tags: ['food', 'culture'],
      durationHours: 1.5,
      activityCost: 0,
      bestTime: 'Evening',
      rainFriendly: true,
      openingHours: '4:00 PM - 10:00 PM',
      openingSource: 'Curated downtown dining estimate',
      priority: 6,
      description: 'Useful for calamay, broas, and snack-focused evenings without a long transfer.'
    },
    hinagdanan_cave: {
      name: 'Hinagdanan Cave',
      lat: 9.6208,
      lng: 123.8052,
      region: 'panglao',
      category: 'nature',
      tags: ['nature', 'adventure'],
      durationHours: 1.5,
      activityCost: 150,
      bestTime: 'Late Morning',
      rainFriendly: true,
      openingHours: '8:00 AM - 5:00 PM',
      openingSource: 'Curated 2026 cave-hours estimate',
      priority: 7,
      description: 'A short cave stop that works especially well when the planner needs weather protection.'
    },
    bohol_bee_farm: {
      name: 'Bohol Bee Farm',
      lat: 9.5765,
      lng: 123.7452,
      region: 'panglao',
      category: 'food',
      tags: ['food', 'nature'],
      durationHours: 1.5,
      activityCost: 0,
      bestTime: 'Midday',
      rainFriendly: true,
      openingHours: '8:00 AM - 8:00 PM',
      openingSource: 'Curated 2026 dining-hours estimate',
      priority: 6,
      description: 'A low-stress Panglao stop for lunch, views, and a slower pacing block.'
    },
    alona_beach: {
      name: 'Alona Beach',
      lat: 9.5491,
      lng: 123.7705,
      region: 'panglao',
      category: 'beach',
      tags: ['beaches', 'food'],
      durationHours: 2,
      activityCost: 0,
      bestTime: 'Late Afternoon',
      rainFriendly: false,
      openingHours: 'Always open',
      openingSource: 'Public beach access',
      priority: 8,
      description: 'Best used as a flexible beach block, sunset anchor, or recovery stop after marine activity.'
    },
    dumaluan_beach: {
      name: 'Dumaluan Beach',
      lat: 9.5653,
      lng: 123.7877,
      region: 'panglao',
      category: 'beach',
      tags: ['beaches', 'nature'],
      durationHours: 1.75,
      activityCost: 100,
      bestTime: 'Afternoon',
      rainFriendly: false,
      openingHours: '8:00 AM - 6:00 PM',
      openingSource: 'Curated 2026 resort-access estimate',
      priority: 6,
      description: 'A quieter Panglao shoreline that helps avoid overloading Alona on longer trips.'
    },
    balicasag_island: {
      name: 'Balicasag Island boat trip',
      lat: 9.5172,
      lng: 123.6838,
      region: 'panglao',
      category: 'marine',
      tags: ['beaches', 'wildlife', 'nature'],
      durationHours: 4.5,
      activityCost: 1150,
      bestTime: 'Morning',
      rainFriendly: false,
      openingHours: 'Early morning departures',
      openingSource: 'Curated 2026 island-hopping estimate',
      priority: 9,
      description: 'A high-value clear-sky day for turtles, coral gardens, and the strongest marine payoff.'
    },
    tarsier_sanctuary: {
      name: 'Tarsier Sanctuary',
      lat: 9.6882,
      lng: 123.9591,
      region: 'inland',
      category: 'wildlife',
      tags: ['wildlife', 'nature'],
      durationHours: 1.25,
      activityCost: 170,
      bestTime: 'Morning',
      rainFriendly: true,
      openingHours: '8:00 AM - 4:00 PM',
      openingSource: 'Curated 2026 sanctuary-hours estimate',
      priority: 9,
      description: 'Early visits are calmer and make the countryside loop feel much more efficient.'
    },
    bilar_forest: {
      name: 'Bilar Manmade Forest',
      lat: 9.7347,
      lng: 124.0674,
      region: 'inland',
      category: 'scenic',
      tags: ['nature'],
      durationHours: 0.5,
      activityCost: 0,
      bestTime: 'Late Morning',
      rainFriendly: false,
      openingHours: 'Always open',
      openingSource: 'Roadside scenic stop',
      priority: 5,
      description: 'Best treated as a brief scenic break rather than a long stop.'
    },
    loboc_river_cruise: {
      name: 'Loboc River Cruise',
      lat: 9.6387,
      lng: 124.0340,
      region: 'inland',
      category: 'river',
      tags: ['nature', 'food', 'culture'],
      durationHours: 2,
      activityCost: 900,
      bestTime: 'Midday',
      rainFriendly: true,
      openingHours: '10:00 AM - 2:00 PM',
      openingSource: 'Curated 2026 cruise-hours estimate',
      priority: 9,
      description: 'A practical lunch anchor that keeps the middle of the day protected and productive.'
    },
    chocolate_hills: {
      name: 'Chocolate Hills viewpoint',
      lat: 9.8292,
      lng: 124.1661,
      region: 'inland',
      category: 'landscape',
      tags: ['nature'],
      durationHours: 1.25,
      activityCost: 150,
      bestTime: 'Late Afternoon',
      rainFriendly: false,
      openingHours: '8:00 AM - 5:00 PM',
      openingSource: 'Curated 2026 viewpoint estimate',
      priority: 10,
      description: 'The island\'s signature landscape and one of the first stops to downgrade in poor visibility.'
    },
    cadapdapan_terraces: {
      name: 'Cadapdapan Rice Terraces',
      lat: 9.9093,
      lng: 124.4780,
      region: 'east',
      category: 'landscape',
      tags: ['nature', 'adventure'],
      durationHours: 1,
      activityCost: 50,
      bestTime: 'Morning',
      rainFriendly: false,
      openingHours: 'Daylight hours',
      openingSource: 'Curated 2026 scenic-stop estimate',
      priority: 8,
      description: 'A better long-day target once the trip is long enough to justify east-side mileage.'
    },
    can_umantad_falls: {
      name: 'Can-umantad Falls',
      lat: 9.9238,
      lng: 124.4789,
      region: 'east',
      category: 'waterfall',
      tags: ['nature', 'adventure'],
      durationHours: 1.75,
      activityCost: 50,
      bestTime: 'Midday',
      rainFriendly: false,
      openingHours: '8:00 AM - 5:00 PM',
      openingSource: 'Curated 2026 waterfall-hours estimate',
      priority: 7,
      description: 'A strong pair with Cadapdapan when the weather is stable and you want a bigger drive day.'
    },
    anda_beach: {
      name: 'Anda Beach',
      lat: 9.7417,
      lng: 124.5761,
      region: 'anda',
      category: 'beach',
      tags: ['beaches', 'nature'],
      durationHours: 2,
      activityCost: 0,
      bestTime: 'Afternoon',
      rainFriendly: false,
      openingHours: 'Always open',
      openingSource: 'Public beach access',
      priority: 7,
      description: 'A clean coast reset that makes the east side feel worth the transfer.'
    },
    lamanoc_island: {
      name: 'Lamanoc Island',
      lat: 9.7794,
      lng: 124.5754,
      region: 'anda',
      category: 'heritage',
      tags: ['culture', 'nature', 'adventure'],
      durationHours: 2,
      activityCost: 450,
      bestTime: 'Morning',
      rainFriendly: false,
      openingHours: '8:00 AM - 4:00 PM',
      openingSource: 'Curated 2026 island-tour estimate',
      priority: 7,
      description: 'A longer-trip stop that adds pre-colonial history and keeps Anda from being just beach time.'
    },
    cabagnow_cave_pool: {
      name: 'Cabagnow Cave Pool',
      lat: 9.7895,
      lng: 124.5658,
      region: 'anda',
      category: 'nature',
      tags: ['nature', 'adventure'],
      durationHours: 1.5,
      activityCost: 100,
      bestTime: 'Late Morning',
      rainFriendly: false,
      openingHours: '8:00 AM - 5:00 PM',
      openingSource: 'Curated 2026 cave-pool estimate',
      priority: 6,
      description: 'A strong companion stop when the route already reaches Anda.'
    },
    binabaje_hills: {
      name: 'Binabaje Hills',
      lat: 9.9437,
      lng: 124.0534,
      region: 'east',
      category: 'hike',
      tags: ['nature', 'adventure'],
      durationHours: 2.5,
      activityCost: 250,
      bestTime: 'Early Morning',
      rainFriendly: false,
      openingHours: 'Sunrise to late afternoon',
      openingSource: 'Curated 2026 hike-hours estimate',
      priority: 8,
      description: 'A hike-first day with the biggest weather sensitivity in the planner.'
    },
    peanut_kisses_viewdeck: {
      name: 'Peanut Kisses viewpoint',
      lat: 9.8594,
      lng: 124.1554,
      region: 'inland',
      category: 'landscape',
      tags: ['nature'],
      durationHours: 0.75,
      activityCost: 50,
      bestTime: 'Late Morning',
      rainFriendly: false,
      openingHours: 'Daylight hours',
      openingSource: 'Curated 2026 scenic-stop estimate',
      priority: 5,
      description: 'Useful as a lighter inland ridge stop on longer nature-heavy trips.'
    },
    canawa_cold_spring: {
      name: 'Canawa Cold Spring',
      lat: 9.9302,
      lng: 124.1044,
      region: 'east',
      category: 'nature',
      tags: ['nature', 'adventure'],
      durationHours: 1.25,
      activityCost: 50,
      bestTime: 'Afternoon',
      rainFriendly: true,
      openingHours: '8:00 AM - 5:00 PM',
      openingSource: 'Curated 2026 spring-hours estimate',
      priority: 5,
      description: 'A cooling east-side stop that helps justify a longer inland adventure day.'
    },
    abatan_firefly: {
      name: 'Abatan River firefly tour',
      lat: 9.7476,
      lng: 123.8834,
      region: 'central',
      category: 'night',
      tags: ['nature'],
      durationHours: 1.5,
      activityCost: 1300,
      bestTime: 'Evening',
      rainFriendly: false,
      openingHours: 'Sunset to evening',
      openingSource: 'Curated 2026 night-tour estimate',
      priority: 8,
      description: 'A strong final-night move that adds something memorable without another full inland grind.'
    }
  };

  const routeBlueprints = [
    {
      id: 'heritage-landing',
      title: 'Historic core warm-up',
      summary: 'A lighter Tagbilaran and Baclayon day with short transfers, heritage value, and easy food stops.',
      region: 'central',
      placeIds: ['blood_compact', 'baclayon_church', 'tagbilaran_food_crawl'],
      stageAffinity: { first: 10, middle: 1, last: 4 },
      baseAffinity: { flexible: 8, panglao: 6, tagbilaran: 10, anda: -4 },
      weatherSuitability: { sunny: 2, mixed: 3, rainy: 3, unknown: 2 },
      paceBonus: { relaxed: 4, balanced: 2, packed: -2 },
      minDays: 2,
      foodBoost: { budget: 250, standard: 450, luxury: 800 },
      narrative: {
        default: 'Best on a first or last day when you still want substance without a long countryside push.',
        rainy: 'This stays useful in wet weather because the stops are short, close, and easier to pivot between.'
      }
    },
    {
      id: 'panglao-reset',
      title: 'Panglao reset day',
      summary: 'A coast-first Panglao route with a cave stop, lunch views, and flexible beach time.',
      region: 'panglao',
      placeIds: ['hinagdanan_cave', 'bohol_bee_farm', 'alona_beach'],
      stageAffinity: { first: 9, middle: 3, last: 7 },
      baseAffinity: { flexible: 7, panglao: 10, tagbilaran: 5, anda: -7 },
      weatherSuitability: { sunny: 3, mixed: 2, rainy: 1, unknown: 2 },
      paceBonus: { relaxed: 5, balanced: 2, packed: -1 },
      minDays: 2,
      foodBoost: { budget: 200, standard: 350, luxury: 700 },
      narrative: {
        default: 'A smart soft-landing day when you want to keep logistics light and still get a clear beach read.',
        rainy: 'Only keep this on the board if showers are light, because the cave can carry just one part of the day.'
      }
    },
    {
      id: 'classic-countryside',
      title: 'Classic countryside loop',
      summary: 'The strongest all-round Bohol day: tarsiers, Loboc, the manmade forest, and Chocolate Hills.',
      region: 'inland',
      placeIds: ['tarsier_sanctuary', 'bilar_forest', 'loboc_river_cruise', 'chocolate_hills'],
      stageAffinity: { first: 7, middle: 10, last: 5 },
      baseAffinity: { flexible: 8, panglao: 8, tagbilaran: 10, anda: -6 },
      weatherSuitability: { sunny: 3, mixed: 2, rainy: 1, unknown: 2 },
      paceBonus: { relaxed: -3, balanced: 4, packed: 6 },
      minDays: 2,
      foodBoost: { budget: 100, standard: 180, luxury: 350 },
      travelBufferMinutes: 25,
      narrative: {
        default: 'The most efficient icon day in the planner and still the best use of one full inland block.',
        sunny: 'This is where clearer skies pay off most because the viewpoint and road scenery both matter.',
        rainy: 'The route still works in light rain, but Chocolate Hills visibility is the first thing to soften.'
      }
    },
    {
      id: 'panglao-marine',
      title: 'Panglao marine day',
      summary: 'A clear-water morning for Balicasag, then a softer coastal afternoon back on Panglao.',
      region: 'panglao',
      placeIds: ['balicasag_island', 'alona_beach', 'hinagdanan_cave'],
      stageAffinity: { first: 6, middle: 8, last: 4 },
      baseAffinity: { flexible: 8, panglao: 10, tagbilaran: 6, anda: -8 },
      weatherSuitability: { sunny: 3, mixed: 2, rainy: 0, unknown: 2 },
      paceBonus: { relaxed: 1, balanced: 4, packed: 5 },
      minDays: 3,
      foodBoost: { budget: 220, standard: 380, luxury: 700 },
      travelBufferMinutes: 80,
      transportSurchargeByMode: { shared_tour: 350, scooter: 250, private_van: 500, private_car: 350 },
      narrative: {
        default: 'Best on the clearest available day because sea state matters more here than anywhere else.',
        rainy: 'This is the planner\'s first route to downgrade if showers or rougher conditions show up.'
      }
    },
    {
      id: 'rainy-culture-loop',
      title: 'Rain-friendly culture circuit',
      summary: 'A practical wet-weather route with heritage, a cave stop, and a sheltered lunch anchor.',
      region: 'central',
      placeIds: ['dauis_church', 'hinagdanan_cave', 'loboc_river_cruise', 'tagbilaran_food_crawl'],
      stageAffinity: { first: 6, middle: 8, last: 6 },
      baseAffinity: { flexible: 7, panglao: 8, tagbilaran: 9, anda: -5 },
      weatherSuitability: { sunny: 1, mixed: 3, rainy: 3, unknown: 2 },
      paceBonus: { relaxed: 2, balanced: 4, packed: 2 },
      minDays: 2,
      foodBoost: { budget: 250, standard: 420, luxury: 780 },
      travelBufferMinutes: 20,
      narrative: {
        default: 'A reliable swap whenever exposed coastal or ridge-heavy plans stop making sense.',
        rainy: 'This is the planner\'s preferred answer to sustained showers because it keeps most of the day useful.'
      }
    },
    {
      id: 'east-bohol-scenic',
      title: 'East Bohol scenic day',
      summary: 'A longer Candijay and Anda drive for terraces, waterfalls, and a cleaner east-side beach finish.',
      region: 'east',
      placeIds: ['cadapdapan_terraces', 'can_umantad_falls', 'anda_beach'],
      stageAffinity: { first: -2, middle: 8, last: 2 },
      baseAffinity: { flexible: 6, panglao: -3, tagbilaran: 4, anda: 7 },
      weatherSuitability: { sunny: 3, mixed: 2, rainy: 0, unknown: 2 },
      paceBonus: { relaxed: -3, balanced: 3, packed: 5 },
      minDays: 4,
      foodBoost: { budget: 180, standard: 260, luxury: 520 },
      travelBufferMinutes: 30,
      narrative: {
        default: 'Only worth it when the itinerary is long enough to justify a big east-side day.',
        sunny: 'Use a clearer day here, because the views and waterfall stop are the reason to absorb the mileage.',
        rainy: 'Not ideal after heavier rain when roads and terrain comfort can fall off quickly.'
      }
    },
    {
      id: 'anda-coast',
      title: 'Anda coast and caves',
      summary: 'A longer-trip Anda day with cave pool time, heritage texture, and a better beach block than a rushed pass-through.',
      region: 'anda',
      placeIds: ['lamanoc_island', 'cabagnow_cave_pool', 'anda_beach'],
      stageAffinity: { first: -3, middle: 7, last: 4 },
      baseAffinity: { flexible: 6, panglao: -8, tagbilaran: -4, anda: 10 },
      weatherSuitability: { sunny: 3, mixed: 2, rainy: 0, unknown: 2 },
      paceBonus: { relaxed: 0, balanced: 3, packed: 3 },
      minDays: 5,
      foodBoost: { budget: 150, standard: 240, luxury: 500 },
      travelBufferMinutes: 45,
      transportSurchargeByMode: { shared_tour: 150, scooter: 75, private_van: 250, private_car: 150 },
      narrative: {
        default: 'This works best once the trip is long enough to let Anda feel intentional instead of rushed.',
        rainy: 'If the weather turns poor, keep only the coast portion and avoid the more exposed island-side timing.'
      }
    },
    {
      id: 'ridge-adventure',
      title: 'Alicia ridge adventure day',
      summary: 'A hike-first inland day for travelers who want stronger terrain and less classic-tour pacing.',
      region: 'east',
      placeIds: ['binabaje_hills', 'peanut_kisses_viewdeck', 'canawa_cold_spring'],
      stageAffinity: { first: -4, middle: 7, last: 1 },
      baseAffinity: { flexible: 5, panglao: -5, tagbilaran: 2, anda: 6 },
      weatherSuitability: { sunny: 3, mixed: 1, rainy: 0, unknown: 2 },
      paceBonus: { relaxed: -4, balanced: 2, packed: 6 },
      minDays: 5,
      foodBoost: { budget: 120, standard: 220, luxury: 420 },
      travelBufferMinutes: 35,
      narrative: {
        default: 'This is the planner\'s most adventure-forward day and the easiest one to skip if the weather softens.',
        sunny: 'Clearer skies matter here because ridge visibility is the whole point.',
        rainy: 'This should be replaced, not forced, when the forecast turns wet.'
      }
    },
    {
      id: 'panglao-caves-and-cafes',
      title: 'Panglao caves and cafes',
      summary: 'A lower-pressure Panglao day that keeps the coast in play without relying on a boat crossing.',
      region: 'panglao',
      placeIds: ['dumaluan_beach', 'hinagdanan_cave', 'bohol_bee_farm'],
      stageAffinity: { first: 5, middle: 5, last: 8 },
      baseAffinity: { flexible: 7, panglao: 10, tagbilaran: 5, anda: -8 },
      weatherSuitability: { sunny: 2, mixed: 3, rainy: 2, unknown: 2 },
      paceBonus: { relaxed: 4, balanced: 2, packed: -1 },
      minDays: 3,
      foodBoost: { budget: 220, standard: 360, luxury: 700 },
      narrative: {
        default: 'A useful Panglao filler when you want coast energy without committing to a full marine day.',
        rainy: 'This stays viable in mixed weather because the cave and lunch block can absorb part of the day.'
      }
    },
    {
      id: 'firefly-finish',
      title: 'Slow coast and firefly finish',
      summary: 'A softer daytime coast block that saves its main payoff for an Abatan firefly evening.',
      region: 'central',
      placeIds: ['dumaluan_beach', 'bohol_bee_farm', 'abatan_firefly'],
      stageAffinity: { first: 1, middle: 4, last: 10 },
      baseAffinity: { flexible: 7, panglao: 7, tagbilaran: 8, anda: -6 },
      weatherSuitability: { sunny: 2, mixed: 2, rainy: 1, unknown: 2 },
      paceBonus: { relaxed: 5, balanced: 3, packed: 0 },
      minDays: 3,
      foodBoost: { budget: 220, standard: 380, luxury: 720 },
      travelBufferMinutes: 40,
      narrative: {
        default: 'A strong last-day move when you still want one memorable experience without another full inland push.'
      }
    }
  ];

  const state = {
    boholForecast: null,
    marineForecast: null,
    generatedPlan: null,
    latestPlanRequestId: 0,
    routeMetricsCache: new Map(),
    routeMetricRequests: new Map()
  };

  const boholCurrentTemp = document.getElementById('bohol-current-temp');
  const boholCurrentStatus = document.getElementById('bohol-current-status');
  const boholCurrentNote = document.getElementById('bohol-current-note');
  const localTemp = document.getElementById('local-temp');
  const localStatus = document.getElementById('local-status');
  const localNote = document.getElementById('local-note');
  const startDateInput = document.getElementById('planner-start-date');
  const tripDaysSelect = document.getElementById('planner-days');
  const styleSelect = document.getElementById('planner-style');
  const baseSelect = document.getElementById('planner-base');
  const transportSelect = document.getElementById('planner-transport');
  const paceSelect = document.getElementById('planner-pace');
  const plannerDaysOutput = document.getElementById('planner-days-output');
  const plannerBudgetOutput = document.getElementById('planner-budget-output');
  const plannerAlerts = document.getElementById('planner-alerts');
  const plannerSummaryText = document.getElementById('planner-summary-text');
  const plannerKpiForecast = document.getElementById('planner-kpi-forecast');
  const plannerKpiForecastSub = document.getElementById('planner-kpi-forecast-sub');
  const plannerKpiFocus = document.getElementById('planner-kpi-focus');
  const plannerKpiFocusSub = document.getElementById('planner-kpi-focus-sub');
  const plannerKpiBudget = document.getElementById('planner-kpi-budget');
  const plannerKpiBudgetSub = document.getElementById('planner-kpi-budget-sub');
  const plannerLiveNote = document.getElementById('planner-live-note');
  const plannerGenerateButton = document.getElementById('planner-generate-button');
  const plannerResults = document.querySelector('.trip-planner-results');

  let plannerButtonResetTimer = null;

  function round(value, precision = 0) {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(Math.round(value));
  }

  function formatDate(dateString, options = {}) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      ...options
    }).format(parseISODate(dateString));
  }

  function formatTime(isoString) {
    const timePart = String(isoString).split('T')[1] || '';
    const [hourText = '0', minuteText = '00'] = timePart.split(':');
    const hour = Number.parseInt(hourText, 10);
    const minute = minuteText.padStart(2, '0');
    const normalizedHour = hour % 12 || 12;
    const meridiem = hour >= 12 ? 'PM' : 'AM';

    return `${normalizedHour}:${minute} ${meridiem}`;
  }

  function formatDuration(minutes) {
    const safeMinutes = Math.max(0, Math.round(minutes));
    const hours = Math.floor(safeMinutes / 60);
    const remainder = safeMinutes % 60;

    if (!hours) {
      return `${remainder}m`;
    }

    if (!remainder) {
      return `${hours}h`;
    }

    return `${hours}h ${remainder}m`;
  }

  function parseISODate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  function toISODate(date) {
    return date.toISOString().slice(0, 10);
  }

  function addDays(dateString, amount) {
    const date = parseISODate(dateString);
    date.setUTCDate(date.getUTCDate() + amount);
    return toISODate(date);
  }

  function getLocalTodayIsoDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getCacheItem(key, ttlMs) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);

      if (!parsed.timestamp || (Date.now() - parsed.timestamp) > ttlMs) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      return null;
    }
  }

  function setCacheItem(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (error) {
      // Ignore storage errors and continue with live data.
    }
  }

  async function fetchJsonWithCache(cacheKey, url, ttlMs) {
    const cached = getCacheItem(cacheKey, ttlMs);

    if (cached) {
      return cached;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    setCacheItem(cacheKey, data);
    return data;
  }

  function getWeatherMeta(code) {
    return weatherCodeMap[code] || { label: 'Variable skies' };
  }

  function classifyWeatherDay(day) {
    const precipitationProbability = Number(day.precipitationProbability || 0);
    const precipitationSum = Number(day.precipitationSum || 0);
    const code = Number(day.weatherCode);

    if (
      [65, 82, 95, 96, 99].includes(code) ||
      precipitationProbability >= 70 ||
      precipitationSum >= 10
    ) {
      return 'rainy';
    }

    if (
      [51, 53, 55, 61, 63, 80, 81].includes(code) ||
      precipitationProbability >= 35 ||
      precipitationSum >= 1
    ) {
      return 'mixed';
    }

    if ([0, 1, 2].includes(code)) {
      return 'sunny';
    }

    return 'mixed';
  }

  function getSeasonalOutlook(dateString) {
    const month = parseISODate(dateString).getUTCMonth() + 1;

    if ([12, 1, 2, 3, 4, 5].includes(month)) {
      return {
        source: 'seasonal',
        category: 'sunny',
        label: 'Seasonal dry-season outlook',
        note: 'Dry-season guidance favors viewpoints, beaches, and boat days.'
      };
    }

    if ([8, 9, 10].includes(month)) {
      return {
        source: 'seasonal',
        category: 'rainy',
        label: 'Seasonal wet-season outlook',
        note: 'Wet-season guidance favors flexibility, cave stops, and shorter exposed routes.'
      };
    }

    return {
      source: 'seasonal',
      category: 'mixed',
      label: 'Seasonal shoulder-season outlook',
      note: 'Expect a mix of sun and showers, and keep one weather backup each day.'
    };
  }

  function describeWeatherDay(day) {
    if (day.source === 'seasonal') {
      return day.note;
    }

    if (day.category === 'sunny') {
      return 'Good visibility for viewpoints and the best odds for marine plans.';
    }

    if (day.category === 'mixed') {
      return 'Keep one indoor or cave stop flexible in the afternoon.';
    }

    return 'Favor heritage, cave, or river-lunch stops over open-water or ridge-heavy plans.';
  }

  function normalizeForecast(data) {
    const dailyByDate = {};

    data.daily.time.forEach((date, index) => {
      dailyByDate[date] = {
        date,
        source: 'live',
        weatherCode: data.daily.weather_code[index],
        temperatureMax: data.daily.temperature_2m_max[index],
        temperatureMin: data.daily.temperature_2m_min[index],
        precipitationProbability: data.daily.precipitation_probability_max[index],
        precipitationSum: data.daily.precipitation_sum[index]
      };
    });

    return {
      current: data.current,
      dailyByDate,
      startDate: data.daily.time[0],
      endDate: data.daily.time[data.daily.time.length - 1]
    };
  }

  function normalizeMarineForecast(data) {
    const dailyByDate = {};

    if (!data.daily?.time?.length) {
      return {
        dailyByDate,
        startDate: null,
        endDate: null
      };
    }

    data.daily.time.forEach((date, index) => {
      dailyByDate[date] = {
        date,
        source: 'live',
        waveHeightMax: data.daily.wave_height_max[index],
        wavePeriodMax: data.daily.wave_period_max[index]
      };
    });

    return {
      dailyByDate,
      startDate: data.daily.time[0],
      endDate: data.daily.time[data.daily.time.length - 1]
    };
  }

  function getForecastForDate(dateString) {
    const liveDay = state.boholForecast?.dailyByDate?.[dateString];

    if (!liveDay) {
      return getSeasonalOutlook(dateString);
    }

    const category = classifyWeatherDay(liveDay);

    return {
      ...liveDay,
      category,
      label: getWeatherMeta(liveDay.weatherCode).label,
      note: describeWeatherDay({ ...liveDay, source: 'live', category })
    };
  }

  function classifyMarineDay(day) {
    const waveHeightMax = Number(day.waveHeightMax || 0);

    if (waveHeightMax >= 1.8) {
      return 'rough';
    }

    if (waveHeightMax >= 1.2) {
      return 'caution';
    }

    return 'calm';
  }

  function describeMarineDay(day) {
    if (!day || day.source !== 'live') {
      return 'Marine guidance is unavailable, so boat-day advice stays conservative.';
    }

    if (day.category === 'rough') {
      return 'Wave conditions look elevated and boat departures may be unreliable.';
    }

    if (day.category === 'caution') {
      return 'Wave conditions look mixed, so confirm departure decisions with operators locally.';
    }

    return 'Wave conditions look comparatively calmer for a boat day.';
  }

  function getMarineForecastForDate(dateString) {
    const liveDay = state.marineForecast?.dailyByDate?.[dateString];

    if (!liveDay) {
      return null;
    }

    const category = classifyMarineDay(liveDay);

    return {
      ...liveDay,
      category,
      note: describeMarineDay({ ...liveDay, source: 'live', category })
    };
  }

  function getSelectedInterests() {
    return Array.from(plannerForm.querySelectorAll('input[name="interest"]:checked')).map(
      (input) => input.value
    );
  }

  function getFormValues() {
    return {
      startDate: startDateInput.value,
      days: Number.parseInt(tripDaysSelect.value, 10),
      style: styleSelect.value,
      base: baseSelect.value,
      transport: transportSelect.value,
      pace: paceSelect.value,
      interests: getSelectedInterests()
    };
  }

  function getDayType(dayIndex, totalDays) {
    if (dayIndex === 0) {
      return 'first';
    }

    if (dayIndex === totalDays - 1) {
      return 'last';
    }

    return 'middle';
  }

  function getDayCapacityMinutes(pace, dayType) {
    const paceProfile = paceProfiles[pace];

    if (dayType === 'first') {
      return paceProfile.firstDayMinutes;
    }

    if (dayType === 'last') {
      return paceProfile.lastDayMinutes;
    }

    return paceProfile.dailyMinutes;
  }

  function getStartAnchor(base, blueprint) {
    if (base === 'flexible') {
      return regionAnchors[blueprint.region] || regionAnchors.central;
    }

    return baseAreas[base] || baseAreas.tagbilaran;
  }

  function haversineKm(pointA, pointB) {
    const earthRadiusKm = 6371;
    const toRadians = (value) => (value * Math.PI) / 180;
    const latDelta = toRadians(pointB.lat - pointA.lat);
    const lngDelta = toRadians(pointB.lng - pointA.lng);
    const startLat = toRadians(pointA.lat);
    const endLat = toRadians(pointB.lat);

    const a = (
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2
    );

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function getBlueprintPlaces(blueprint) {
    return blueprint.placeIds.map((placeId) => placeCatalog[placeId]);
  }

  function isMarineBlueprint(blueprint) {
    return blueprint.placeIds.includes('balicasag_island');
  }

  function buildRouteMetricCacheKey(base, blueprintId) {
    return `feelbohol:planner:route-metrics:v2:${base}:${blueprintId}`;
  }

  function getRoutePoints(blueprint, base) {
    const anchor = getStartAnchor(base, blueprint);
    const places = getBlueprintPlaces(blueprint);

    return [
      anchor,
      ...places.map((place) => ({ lat: place.lat, lng: place.lng })),
      anchor
    ];
  }

  function serializeRoutePoints(points) {
    return points
      .map((point) => `${point.lng},${point.lat}`)
      .join(';');
  }

  function getBlueprintActivityMinutes(blueprint) {
    return getBlueprintPlaces(blueprint)
      .reduce((total, place) => total + (place.durationHours * 60), 0);
  }

  function buildRouteMetricsFromDriveData(blueprint, transport, driveDistanceKm, driveMinutes, source) {
    const transportProfile = transportProfiles[transport];
    const places = getBlueprintPlaces(blueprint);
    const travelMinutes = (
      (driveMinutes * transportProfile.routeDurationMultiplier) +
      (places.length * 8) +
      (blueprint.travelBufferMinutes || 0)
    );
    const activityMinutes = getBlueprintActivityMinutes(blueprint);
    const totalMinutes = travelMinutes + activityMinutes;

    return {
      source,
      distanceKm: round(driveDistanceKm, 1),
      travelMinutes: Math.round(travelMinutes),
      activityMinutes: Math.round(activityMinutes),
      totalMinutes: Math.round(totalMinutes)
    };
  }

  function getHeuristicRouteMetrics(blueprint, base, transport) {
    const places = getBlueprintPlaces(blueprint);
    const transportProfile = transportProfiles[transport];
    const anchor = getStartAnchor(base, blueprint);

    let distanceKm = 0;
    let previousPoint = anchor;

    places.forEach((place) => {
      distanceKm += haversineKm(previousPoint, { lat: place.lat, lng: place.lng });
      previousPoint = { lat: place.lat, lng: place.lng };
    });

    distanceKm += haversineKm(previousPoint, anchor);

    const travelMinutes = (
      (distanceKm / transportProfile.speedKph) * 60 * 1.18 +
      (places.length * 12) +
      (blueprint.travelBufferMinutes || 0)
    );
    const activityMinutes = getBlueprintActivityMinutes(blueprint);
    const totalMinutes = travelMinutes + activityMinutes;

    return {
      source: 'heuristic',
      distanceKm: round(distanceKm, 1),
      travelMinutes: Math.round(travelMinutes),
      activityMinutes: Math.round(activityMinutes),
      totalMinutes: Math.round(totalMinutes)
    };
  }

  async function getLiveRouteBaseMetrics(blueprint, base) {
    const requestKey = `${base}:${blueprint.id}`;

    if (state.routeMetricsCache.has(requestKey)) {
      return state.routeMetricsCache.get(requestKey);
    }

    if (state.routeMetricRequests.has(requestKey)) {
      return state.routeMetricRequests.get(requestKey);
    }

    const request = (async () => {
      const url = `${OSRM_ROUTE_BASE_URL}${serializeRoutePoints(getRoutePoints(blueprint, base))}?overview=false`;
      const cacheKey = buildRouteMetricCacheKey(base, blueprint.id);
      const data = await fetchJsonWithCache(cacheKey, url, ROUTE_CACHE_TTL_MS);
      const route = data.routes?.[0];

      if (!route) {
        throw new Error('No route returned from routing service.');
      }

      const baseMetrics = {
        distanceKm: route.distance / 1000,
        driveMinutes: route.duration / 60
      };

      state.routeMetricsCache.set(requestKey, baseMetrics);
      return baseMetrics;
    })()
      .catch(() => null)
      .finally(() => {
        state.routeMetricRequests.delete(requestKey);
      });

    state.routeMetricRequests.set(requestKey, request);
    return request;
  }

  async function getRouteMetrics(blueprint, base, transport) {
    const liveBaseMetrics = await getLiveRouteBaseMetrics(blueprint, base);

    if (liveBaseMetrics) {
      return buildRouteMetricsFromDriveData(
        blueprint,
        transport,
        liveBaseMetrics.distanceKm,
        liveBaseMetrics.driveMinutes,
        'live-routing'
      );
    }

    return getHeuristicRouteMetrics(blueprint, base, transport);
  }

  function getInterestScore(blueprint, interests) {
    if (!interests.length) {
      return 0;
    }

    const tagCounts = {};

    getBlueprintPlaces(blueprint).forEach((place) => {
      place.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return interests.reduce((score, interest) => {
      const matches = tagCounts[interest] || 0;

      if (!matches) {
        return score - 1;
      }

      return score + 4 + (matches * 2);
    }, 0);
  }

  function getPriorityScore(blueprint) {
    return getBlueprintPlaces(blueprint).reduce((score, place) => score + place.priority, 0) / 5;
  }

  async function evaluateBlueprint(blueprint, context) {
    if (context.trip.days < blueprint.minDays) {
      return null;
    }

    const routeMetrics = await getRouteMetrics(blueprint, context.trip.base, context.trip.transport);
    const dayCapacity = getDayCapacityMinutes(context.trip.pace, context.dayType);
    const stopCount = blueprint.placeIds.length;
    const transport = context.trip.transport;
    const weatherCategory = context.weather.category;
    const marine = isMarineBlueprint(blueprint)
      ? getMarineForecastForDate(context.date)
      : null;
    let score = 0;

    score += getInterestScore(blueprint, context.trip.interests);
    score += getPriorityScore(blueprint);
    score += blueprint.stageAffinity[context.dayType] || 0;
    score += blueprint.baseAffinity[context.trip.base] || 0;
    score += ((blueprint.weatherSuitability[weatherCategory] || 2) * 8);
    score += (paceProfiles[context.trip.pace].stopScore[stopCount] || 0);
    score += (blueprint.paceBonus[context.trip.pace] || 0);

    if (context.previousRegion && context.previousRegion === blueprint.region) {
      score -= 5;
    }

    if (context.usedBlueprintIds.has(blueprint.id)) {
      score -= 40;
    }

    if (routeMetrics.totalMinutes > dayCapacity) {
      score -= (routeMetrics.totalMinutes - dayCapacity) / 8;
    }

    if (transport === 'scooter' && routeMetrics.distanceKm > 140) {
      score -= 12;
    }

    if (transport === 'shared_tour' && ['east', 'anda'].includes(blueprint.region)) {
      score -= 10;
    }

    if (weatherCategory === 'rainy' && blueprint.weatherSuitability.rainy === 0) {
      score -= 25;
    }

    if (marine?.category === 'rough') {
      score -= 32;
    } else if (marine?.category === 'caution') {
      score -= 12;
    } else if (marine?.category === 'calm') {
      score += 6;
    } else if (isMarineBlueprint(blueprint) && weatherCategory !== 'sunny') {
      score -= 8;
    }

    return {
      blueprint,
      routeMetrics,
      score,
      marine
    };
  }

  function getTransportCost(blueprint, routeMetrics, transport) {
    const profile = transportProfiles[transport];
    const surcharge = blueprint.transportSurchargeByMode?.[transport] || 0;
    return Math.round(profile.baseCost + (routeMetrics.distanceKm * profile.perKmCost) + surcharge);
  }

  function getActivityCost(blueprint, style) {
    const styleProfile = styleProfiles[style];
    const places = getBlueprintPlaces(blueprint);
    const paidStops = places.filter((place) => place.activityCost > 0).length;
    const baseActivityCost = places.reduce((total, place) => total + place.activityCost, 0);
    return Math.round(baseActivityCost + (paidStops * styleProfile.activityComfort));
  }

  function getFoodBoost(blueprint, style) {
    return blueprint.foodBoost?.[style] || 0;
  }

  async function getFallbackOption(blueprint, context) {
    if (!['mixed', 'rainy'].includes(context.weather.category)) {
      return null;
    }

    const alternatives = (await Promise.all(
      routeBlueprints
        .filter((candidate) => candidate.id !== blueprint.id)
        .map((candidate) => evaluateBlueprint(candidate, context))
    ))
      .filter(Boolean)
      .filter((candidate) => (candidate.blueprint.weatherSuitability[context.weather.category] || 0) >= 2)
      .sort((left, right) => right.score - left.score);

    if (!alternatives.length) {
      return null;
    }

    return alternatives[0].blueprint.title;
  }

  async function buildPlan(trip) {
    const days = [];
    const usedBlueprintIds = new Set();
    const wetLiveDates = [];
    const marineAlertDays = [];
    let previousRegion = null;

    for (let index = 0; index < trip.days; index += 1) {
      const date = addDays(trip.startDate, index);
      const weather = getForecastForDate(date);
      const dayType = getDayType(index, trip.days);
      const candidates = (await Promise.all(
        routeBlueprints.map((blueprint) => evaluateBlueprint(blueprint, {
          trip,
          date,
          weather,
          dayType,
          previousRegion,
          usedBlueprintIds
        }))
      ))
        .filter(Boolean)
        .sort((left, right) => right.score - left.score);

      const chosen = candidates[0];

      if (!chosen) {
        continue;
      }

      const fallback = await getFallbackOption(chosen.blueprint, {
        trip,
        date,
        weather,
        dayType,
        previousRegion,
        usedBlueprintIds
      });
      const transportCost = getTransportCost(chosen.blueprint, chosen.routeMetrics, trip.transport);
      const activityCost = getActivityCost(chosen.blueprint, trip.style);
      const foodBoost = getFoodBoost(chosen.blueprint, trip.style);
      const note = (
        chosen.blueprint.narrative[weather.category] ||
        chosen.blueprint.narrative.default ||
        describeWeatherDay(weather)
      );

      if (weather.source === 'live' && weather.category === 'rainy') {
        wetLiveDates.push(date);
      }

      if (chosen.marine?.source === 'live' && chosen.marine.category !== 'calm') {
        marineAlertDays.push({
          date,
          category: chosen.marine.category,
          waveHeightMax: chosen.marine.waveHeightMax
        });
      }

      days.push({
        date,
        weather,
        marine: chosen.marine,
        dayType,
        blueprint: chosen.blueprint,
        routeMetrics: chosen.routeMetrics,
        costs: {
          transport: transportCost,
          activities: activityCost,
          foodBoost
        },
        note,
        fallback,
        places: getBlueprintPlaces(chosen.blueprint)
      });

      usedBlueprintIds.add(chosen.blueprint.id);
      previousRegion = chosen.blueprint.region;
    }

    const styleProfile = styleProfiles[trip.style];
    const nights = Math.max(trip.days - 1, 1);
    const accommodation = nights * styleProfile.accommodationPerNight;
    const meals = (
      (trip.days * styleProfile.foodPerDay) +
      days.reduce((total, day) => total + day.costs.foodBoost, 0)
    );
    const transport = days.reduce((total, day) => total + day.costs.transport, 0);
    const activities = days.reduce((total, day) => total + day.costs.activities, 0);
    const extras = trip.days * styleProfile.miscPerDay;
    const total = accommodation + meals + transport + activities + extras;
    const averageRoadMinutes = days.length
      ? Math.round(days.reduce((totalMinutes, day) => totalMinutes + day.routeMetrics.travelMinutes, 0) / days.length)
      : 0;

    const tagScores = {};
    days.forEach((day) => {
      day.places.forEach((place) => {
        place.tags.forEach((tag) => {
          tagScores[tag] = (tagScores[tag] || 0) + 1;
        });
      });
    });

    const focusTags = Object.keys(tagScores)
      .sort((left, right) => tagScores[right] - tagScores[left])
      .slice(0, 2);

    return {
      trip,
      days,
      wetLiveDates,
      marineAlertDays,
      budget: {
        accommodation,
        meals,
        transport,
        activities,
        extras,
        total,
        nights
      },
      metrics: {
        averageRoadMinutes,
        liveRoutingDays: days.filter((day) => day.routeMetrics.source === 'live-routing').length,
        maxRoadMinutes: days.reduce(
          (maximum, day) => Math.max(maximum, day.routeMetrics.travelMinutes),
          0
        )
      },
      focusTags
    };
  }

  function getForecastCoverage(plan) {
    const liveDays = plan.days.filter((day) => day.weather.source === 'live').length;

    if (!state.boholForecast) {
      return {
        label: 'Seasonal guide',
        sub: 'Forecast data is not available right now, so the planner is using seasonal logic.'
      };
    }

    if (liveDays === plan.days.length) {
      return {
        label: 'Live forecast',
        sub: `${liveDays}/${plan.days.length} trip days are backed by live forecast data through ${formatDate(state.boholForecast.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}.`
      };
    }

    if (liveDays > 0) {
      return {
        label: 'Part live',
        sub: `${liveDays}/${plan.days.length} trip days have live forecast coverage through ${formatDate(state.boholForecast.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}; the rest use seasonal guidance.`
      };
    }

    return {
      label: 'Seasonal guide',
      sub: `Your trip starts after ${formatDate(state.boholForecast.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}, so the planner is using seasonal weather logic.`
    };
  }

  function getMarineCoverage(plan) {
    const marineDays = plan.days.filter((day) => isMarineBlueprint(day.blueprint));

    if (!marineDays.length) {
      return {
        label: 'No marine days',
        sub: 'This itinerary does not depend on a boat-day sea-state check.'
      };
    }

    if (!state.marineForecast?.startDate || !state.marineForecast?.endDate) {
      return {
        label: 'Marine fallback',
        sub: 'Marine forecast is unavailable right now, so boat-day scoring stays conservative.'
      };
    }

    const liveMarineDays = marineDays.filter((day) => day.marine?.source === 'live').length;

    if (liveMarineDays === marineDays.length) {
      return {
        label: 'Live marine',
        sub: `${liveMarineDays}/${marineDays.length} boat day${marineDays.length === 1 ? '' : 's'} use live wave guidance through ${formatDate(state.marineForecast.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}.`
      };
    }

    if (liveMarineDays > 0) {
      return {
        label: 'Part live marine',
        sub: `${liveMarineDays}/${marineDays.length} boat day${marineDays.length === 1 ? '' : 's'} use live wave guidance; later marine days stay conservative.`
      };
    }

    return {
      label: 'Marine fallback',
      sub: 'Your boat day sits outside the marine forecast window, so the planner is staying conservative on sea conditions.'
    };
  }

  function getFocusCopy(plan) {
    const focusTags = plan.focusTags.map((tag) => interestsCopy[tag]).filter(Boolean);
    const hasRainFallback = plan.days.some((day) => day.weather.category === 'rainy' || day.fallback);

    if (hasRainFallback && focusTags.length) {
      return {
        title: `${focusTags[0]} route with weather flex`,
        subtitle: `${paceProfiles[plan.trip.pace].label} pacing from ${baseAreas[plan.trip.base].label} by ${transportProfiles[plan.trip.transport].label}.`
      };
    }

    if (focusTags.length >= 2) {
      return {
        title: `${focusTags[0]} + ${focusTags[1]} island mix`,
        subtitle: `${paceProfiles[plan.trip.pace].label} pacing from ${baseAreas[plan.trip.base].label} by ${transportProfiles[plan.trip.transport].label}.`
      };
    }

    return {
      title: 'Balanced island sampler',
      subtitle: `${paceProfiles[plan.trip.pace].label} pacing from ${baseAreas[plan.trip.base].label} by ${transportProfiles[plan.trip.transport].label}.`
    };
  }

  function getTripSummary(plan) {
    const interests = plan.trip.interests.map((interest) => interestsCopy[interest]).join(', ');
    const endDate = addDays(plan.trip.startDate, plan.trip.days - 1);
    const coverage = getForecastCoverage(plan);
    const routingCopy = plan.metrics.liveRoutingDays
      ? `${plan.metrics.liveRoutingDays}/${plan.days.length} day${plan.days.length === 1 ? '' : 's'} use live road routing`
      : 'road times are still modeled';

    return `${formatDate(plan.trip.startDate, { month: 'short', day: 'numeric', year: 'numeric' })} to ${formatDate(endDate, { month: 'short', day: 'numeric', year: 'numeric' })}: ${plan.trip.days} days from ${baseAreas[plan.trip.base].label}. The planner leans into ${interests || 'broad island highlights'}, keeps average road time near ${formatDuration(plan.metrics.averageRoadMinutes)}, uses ${coverage.label.toLowerCase()} logic to avoid weak weather matches, and ${routingCopy}.`;
  }

  function getPlannerAlerts(plan) {
    const alerts = [];
    const coverage = getForecastCoverage(plan);
    const marineCoverage = getMarineCoverage(plan);

    alerts.push({
      tone: 'info',
      text: coverage.sub
    });

    alerts.push({
      tone: 'info',
      text: plan.metrics.liveRoutingDays
        ? `${plan.metrics.liveRoutingDays}/${plan.days.length} trip day${plan.days.length === 1 ? '' : 's'} use live road-route timing. Any remaining days fall back to modeled road estimates.`
        : 'Road times are still modeled from route heuristics because live road routing was not available during this build.'
    });

    alerts.push({
      tone: 'info',
      text: 'Attraction hours, activity pricing, and operator availability should still be confirmed locally before the day of travel.'
    });

    if (plan.wetLiveDates.length) {
      const formattedDates = plan.wetLiveDates
        .slice(0, 2)
        .map((date) => formatDate(date, { month: 'short', day: 'numeric' }))
        .join(', ');

      alerts.push({
        tone: 'warn',
        text: `${formattedDates} currently looks wet, so the planner shifts toward caves, heritage stops, or sheltered lunch blocks instead of exposed boat or ridge-heavy days.`
      });
    }

    if (plan.days.some((day) => day.blueprint.id === 'panglao-marine')) {
      alerts.push({
        tone: 'info',
        text: marineCoverage.sub
      });

      alerts.push({
        tone: 'warn',
        text: 'Balicasag and other boat-based days still depend on sea state and operator decisions, so confirm marine departures locally the evening before or morning of travel.'
      });
    }

    if (plan.marineAlertDays.length) {
      const marineDates = plan.marineAlertDays
        .slice(0, 2)
        .map((day) => `${formatDate(day.date, { month: 'short', day: 'numeric' })} (${round(day.waveHeightMax, 1)} m)`)
        .join(', ');

      alerts.push({
        tone: 'warn',
        text: `${marineDates} currently shows elevated wave height for the marine leg, so the planner downranks open-water plans on those dates.`
      });
    }

    if (['scooter', 'shared_tour'].includes(plan.trip.transport) && plan.metrics.maxRoadMinutes >= 210) {
      alerts.push({
        tone: 'warn',
        text: `${transportProfiles[plan.trip.transport].label} will hit at least one long road day (${formatDuration(plan.metrics.maxRoadMinutes)}). A private car or van would be more comfortable for the east-side legs.`
      });
    }

    const tripEndDate = addDays(plan.trip.startDate, plan.trip.days - 1);
    const startMonth = parseISODate(plan.trip.startDate).getUTCMonth() + 1;
    const endMonth = parseISODate(tripEndDate).getUTCMonth() + 1;

    if (startMonth <= 7 && endMonth >= 7) {
      alerts.push({
        tone: 'info',
        text: 'Trips crossing July line up with Sandugo Festival demand in Tagbilaran, so stays and transport usually tighten faster than normal.'
      });
    }

    return alerts;
  }

  function renderAlerts(alerts) {
    plannerAlerts.innerHTML = alerts
      .map((alert) => `
        <div class="trip-planner-alert trip-planner-alert--${escapeHtml(alert.tone)}">
          <p>${escapeHtml(alert.text)}</p>
        </div>
      `)
      .join('');
  }

  function renderDays(plan) {
    plannerDaysOutput.innerHTML = plan.days
      .map((day, index) => {
        const weatherMeta = day.weather.source === 'live'
          ? `${escapeHtml(day.weather.label)} - ${Math.round(day.weather.temperatureMax)}C / ${Math.round(day.weather.temperatureMin)}C`
          : escapeHtml(day.weather.label);
        const routingMeta = day.routeMetrics.source === 'live-routing'
          ? 'Live road route'
          : 'Estimated road route';
        const stopMarkup = day.places
          .map((place) => `
            <li class="planner-stop">
              <div class="planner-stop__time">${escapeHtml(place.bestTime)}</div>
              <div class="planner-stop__copy">
                <strong>${escapeHtml(place.name)}</strong>
                <p>${escapeHtml(place.description)}</p>
              </div>
            </li>
          `)
          .join('');
        const footerBits = [
          `Road time ${formatDuration(day.routeMetrics.travelMinutes)}`,
          `${day.routeMetrics.distanceKm} km`,
          weatherMeta,
          routingMeta
        ];

        if (day.marine?.source === 'live') {
          footerBits.push(`Wave max ${round(day.marine.waveHeightMax, 1)} m`);
        }

        if (day.fallback) {
          footerBits.push(`Rain swap: ${day.fallback}`);
        }

        return `
          <article class="planner-day-card">
            <div class="planner-day-card__top">
              <div>
                <p class="planner-day-card__eyebrow">Day ${index + 1} - ${escapeHtml(formatDate(day.date, { weekday: 'short', month: 'short', day: 'numeric' }))}</p>
                <h4 class="planner-day-card__title">${escapeHtml(day.blueprint.title)}</h4>
              </div>
              <div class="planner-day-card__meta">
                <span class="planner-chip">${escapeHtml(day.blueprint.region)}</span>
                <span class="planner-chip">${escapeHtml(day.places.length.toString())} stops</span>
              </div>
            </div>
            <p class="planner-day-card__summary">${escapeHtml(day.blueprint.summary)}</p>
            <p class="planner-day-card__note">${escapeHtml(day.note)}</p>
            <ul class="planner-stop-list">${stopMarkup}</ul>
            <div class="planner-day-card__footer">
              ${footerBits.map((bit) => `<span>${escapeHtml(bit)}</span>`).join('')}
            </div>
          </article>
        `;
      })
      .join('');
  }

  function renderBudget(plan) {
    const dailyAverage = Math.round(plan.budget.total / plan.trip.days);
    const rows = [
      {
        label: 'Accommodation',
        value: plan.budget.accommodation,
        meta: `${plan.budget.nights} night${plan.budget.nights === 1 ? '' : 's'} at ${styleProfiles[plan.trip.style].label.toLowerCase()}-style stays`
      },
      {
        label: 'Meals and cafe stops',
        value: plan.budget.meals,
        meta: 'Daily food baseline plus route-specific dining blocks'
      },
      {
        label: 'Transport',
        value: plan.budget.transport,
        meta: `${transportProfiles[plan.trip.transport].label} across ${plan.days.length} planned route day${plan.days.length === 1 ? '' : 's'}`
      },
      {
        label: 'Activities and entry fees',
        value: plan.budget.activities,
        meta: 'Built from the actual places selected into this route'
      },
      {
        label: 'Local extras',
        value: plan.budget.extras,
        meta: 'Cash buffer for small fees, snacks, and on-the-ground flexibility'
      }
    ];

    plannerBudgetOutput.innerHTML = `
      <div class="planner-budget-card">
        ${rows.map((row) => `
          <div class="planner-budget-row">
            <div class="planner-budget-row__copy">
              <span class="planner-budget-row__label">${escapeHtml(row.label)}</span>
              <p>${escapeHtml(row.meta)}</p>
            </div>
            <strong>${escapeHtml(formatCurrency(row.value))}</strong>
          </div>
        `).join('')}
        <div class="planner-budget-total">
          <span>Total estimate</span>
          <strong>${escapeHtml(formatCurrency(plan.budget.total))}</strong>
          <p>About ${escapeHtml(formatCurrency(dailyAverage))} per day before airfare.</p>
        </div>
      </div>
    `;
  }

  function renderKpis(plan) {
    const coverage = getForecastCoverage(plan);
    const focusCopy = getFocusCopy(plan);

    plannerKpiForecast.textContent = coverage.label;
    plannerKpiForecastSub.textContent = coverage.sub;
    plannerKpiFocus.textContent = focusCopy.title;
    plannerKpiFocusSub.textContent = focusCopy.subtitle;
    plannerKpiBudget.textContent = formatCurrency(plan.budget.total);
    plannerKpiBudgetSub.textContent = `${formatCurrency(Math.round(plan.budget.total / plan.trip.days))} per day across ${plan.budget.nights} night${plan.budget.nights === 1 ? '' : 's'}.`;
    plannerSummaryText.textContent = getTripSummary(plan);
  }

  function renderEmptyState(message) {
    const emptyMarkup = `<div class="planner-empty">${escapeHtml(message)}</div>`;
    plannerDaysOutput.innerHTML = emptyMarkup;
    plannerBudgetOutput.innerHTML = emptyMarkup;
  }

  function resetPlannerSummary(forecastLabel, forecastSub, summary) {
    plannerKpiForecast.textContent = forecastLabel;
    plannerKpiForecastSub.textContent = forecastSub;
    plannerKpiFocus.textContent = 'Waiting for input';
    plannerKpiFocusSub.textContent = 'Choose your dates, interests, and pace to score the route.';
    plannerKpiBudget.textContent = formatCurrency(0);
    plannerKpiBudgetSub.textContent = 'A budget estimate appears after the planner builds a route.';
    plannerSummaryText.textContent = summary;
  }

  function renderCurrentBoholWeather() {
    if (!state.boholForecast?.current) {
      boholCurrentTemp.textContent = '--C';
      boholCurrentStatus.textContent = 'Live forecast unavailable';
      boholCurrentNote.textContent = 'The planner will fall back to seasonal guidance until the weather service responds.';
      return;
    }

    const current = state.boholForecast.current;
    const label = getWeatherMeta(current.weather_code).label;

    boholCurrentTemp.textContent = `${Math.round(current.temperature_2m)}C`;
    boholCurrentStatus.textContent = label;
    boholCurrentNote.textContent = `Updated ${formatTime(current.time)} in Bohol. Live trip forecast currently extends through ${formatDate(state.boholForecast.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}.`;
  }

  function renderForecastWindowNote() {
    const weatherWindow = state.boholForecast
      ? `Weather forecast covers ${formatDate(state.boholForecast.startDate, { month: 'short', day: 'numeric', year: 'numeric' })} to ${formatDate(state.boholForecast.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}.`
      : 'Weather forecast is temporarily unavailable, so the planner is using seasonal guidance.';
    const marineWindow = state.marineForecast?.startDate
      ? `Boat-day marine checks cover ${formatDate(state.marineForecast.startDate, { month: 'short', day: 'numeric', year: 'numeric' })} to ${formatDate(state.marineForecast.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}.`
      : 'Boat-day marine checks are temporarily unavailable.';

    plannerLiveNote.textContent = `${weatherWindow} ${marineWindow} Attraction hours and pricing remain guide estimates.`;
  }

  async function loadBoholForecast() {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${BOHOL_COORDS.latitude}&longitude=${BOHOL_COORDS.longitude}&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&forecast_days=16&timezone=${encodeURIComponent(BOHOL_COORDS.timezone)}`;

    try {
      const data = await fetchJsonWithCache(FORECAST_CACHE_KEY, apiUrl, FORECAST_CACHE_TTL_MS);
      state.boholForecast = normalizeForecast(data);
    } catch (error) {
      state.boholForecast = null;
    }

    renderCurrentBoholWeather();
    renderForecastWindowNote();
  }

  async function loadMarineForecast() {
    const apiUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${BALICASAG_COORDS.latitude}&longitude=${BALICASAG_COORDS.longitude}&daily=wave_height_max,wave_period_max&forecast_days=8&timezone=${encodeURIComponent(BALICASAG_COORDS.timezone)}`;

    try {
      const data = await fetchJsonWithCache(MARINE_FORECAST_CACHE_KEY, apiUrl, MARINE_FORECAST_TTL_MS);
      state.marineForecast = normalizeMarineForecast(data);
    } catch (error) {
      state.marineForecast = null;
    }

    renderForecastWindowNote();
  }

  async function loadLocalWeather() {
    if (!('geolocation' in navigator)) {
      localStatus.textContent = 'Location lookup unsupported';
      localNote.textContent = 'Your browser does not expose geolocation, so only the Bohol weather card can stay live.';
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      localStatus.textContent = 'Location needs HTTPS';
      localNote.textContent = 'Browsers usually block location access on insecure pages. Open this site on HTTPS or localhost to compare your local weather.';
      return;
    }

    localStatus.textContent = 'Requesting location access...';
    localNote.textContent = 'Approve location access to compare your local conditions with Bohol.';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = round(position.coords.latitude, 2);
        const longitude = round(position.coords.longitude, 2);
        const cacheKey = `feelbohol:planner:local-weather:${latitude}:${longitude}`;
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current=temperature_2m,weather_code&timezone=auto`;

        try {
          const data = await fetchJsonWithCache(cacheKey, apiUrl, LOCAL_CACHE_TTL_MS);
          const label = getWeatherMeta(data.current.weather_code).label;

          localTemp.textContent = `${Math.round(data.current.temperature_2m)}C`;
          localStatus.textContent = label;
          localNote.textContent = `Live local comparison from roughly ${latitude}, ${longitude}.`;
        } catch (error) {
          localStatus.textContent = 'Local weather unavailable';
          localNote.textContent = 'Location worked, but the live weather lookup did not. The main Bohol planner still works.';
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          localStatus.textContent = 'Location denied';
          localNote.textContent = 'Allow location access if you want the page to compare your current weather with Bohol.';
          return;
        }

        localStatus.textContent = 'Location unavailable';
        localNote.textContent = 'Your location could not be resolved, so the comparison card is staying in fallback mode.';
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 10 * 60 * 1000
      }
    );
  }

  function setPlannerBusyState(isBusy, label = 'Generate My Trip') {
    if (!plannerGenerateButton) {
      return;
    }

    if (plannerButtonResetTimer) {
      window.clearTimeout(plannerButtonResetTimer);
      plannerButtonResetTimer = null;
    }

    plannerGenerateButton.disabled = isBusy;
    plannerGenerateButton.setAttribute('aria-busy', isBusy ? 'true' : 'false');
    plannerGenerateButton.textContent = label;
  }

  async function planAndRender() {
    const requestId = state.latestPlanRequestId + 1;
    state.latestPlanRequestId = requestId;

    const trip = getFormValues();

    if (!trip.startDate) {
      setPlannerBusyState(false);
      renderEmptyState('Select a start date to generate your trip.');
      resetPlannerSummary(
        'Select dates',
        'Trip forecast coverage appears after you choose a start date.',
        'Select your trip details and the planner will build a realistic route for Bohol.'
      );
      renderAlerts([
        {
          tone: 'warn',
          text: 'Choose a start date before generating the itinerary.'
        }
      ]);
      return false;
    }

    if (!trip.interests.length) {
      setPlannerBusyState(false);
      renderEmptyState('Select at least one interest so the planner can score the route properly.');
      resetPlannerSummary(
        'Needs interests',
        'Weather logic is ready, but the planner needs at least one interest to score routes.',
        'Pick at least one interest so the itinerary logic can decide which Bohol experiences matter most.'
      );
      renderAlerts([
        {
          tone: 'warn',
          text: 'Pick at least one interest before generating a route.'
        }
      ]);
      return false;
    }

    setPlannerBusyState(true, 'Building Trip...');

    try {
      const plan = await buildPlan(trip);

      if (requestId !== state.latestPlanRequestId) {
        return false;
      }

      state.generatedPlan = plan;
      renderKpis(plan);
      renderAlerts(getPlannerAlerts(plan));
      renderDays(plan);
      renderBudget(plan);
      setPlannerBusyState(false);
      return true;
    } catch (error) {
      if (requestId !== state.latestPlanRequestId) {
        return false;
      }

      renderEmptyState('The planner hit a temporary error while building your itinerary.');
      resetPlannerSummary(
        'Planner issue',
        'The planner could not finish this route build. Try again in a moment.',
        'Weather and routing data could not be combined for this request.'
      );
      renderAlerts([
        {
          tone: 'warn',
          text: 'The planner hit a temporary error while building your trip. Please try again.'
        }
      ]);
      setPlannerBusyState(false);
      return false;
    }
  }

  function announcePlannerGeneration() {
    if (!plannerGenerateButton) {
      return;
    }

    if (plannerButtonResetTimer) {
      window.clearTimeout(plannerButtonResetTimer);
    }

    plannerGenerateButton.textContent = 'Trip Generated';
    plannerButtonResetTimer = window.setTimeout(() => {
      plannerGenerateButton.textContent = 'Generate My Trip';
      plannerButtonResetTimer = null;
    }, 1800);
  }

  function revealGeneratedPlan() {
    if (!plannerResults) {
      return;
    }

    plannerResults.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    const focusTarget = plannerResults.querySelector('.trip-planner-panel__title');

    if (!focusTarget) {
      return;
    }

    focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    const didGenerate = await planAndRender();

    if (!didGenerate) {
      return;
    }

    announcePlannerGeneration();
    revealGeneratedPlan();
  }

  function initializePlanner() {
    const today = getLocalTodayIsoDate();

    startDateInput.min = today;

    if (!startDateInput.value) {
      startDateInput.value = today;
    }

    renderEmptyState('Loading live Bohol weather, marine checks, and route logic...');
    plannerKpiForecast.textContent = 'Loading...';
    plannerKpiForecastSub.textContent = 'Preparing weather-aware itinerary scoring.';

    plannerForm.addEventListener('submit', handleFormSubmit);
    plannerForm.addEventListener('change', () => {
      void planAndRender();
    });
    startDateInput.addEventListener('input', () => {
      void planAndRender();
    });

    void planAndRender();
    Promise.all([
      loadBoholForecast(),
      loadMarineForecast()
    ]).finally(() => {
      void planAndRender();
    });
    loadLocalWeather();
  }

  initializePlanner();
});
