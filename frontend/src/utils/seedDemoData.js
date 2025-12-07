// Seed realistic demo data for AETHER DMX

export const seedDemoScenes = (createScene) => {
  const demoScenes = [
    {
      name: 'Warm White',
      description: 'Cozy warm white wash',
      universe: 1,
      channels: {
        1: 255, 2: 220, 3: 180, 4: 255,
        5: 220, 6: 180, 7: 255, 8: 220
      },
      fadeTime: 2,
      color: '#ffa500'
    },
    {
      name: 'Cool Blue',
      description: 'Cool blue atmosphere',
      universe: 1,
      channels: {
        1: 80, 2: 150, 3: 255, 4: 80,
        5: 150, 6: 255, 7: 80, 8: 150
      },
      fadeTime: 3,
      color: '#4a90e2'
    },
    {
      name: 'Red Alert',
      description: 'Intense red emergency',
      universe: 1,
      channels: {
        1: 255, 2: 0, 3: 0, 4: 255,
        5: 0, 6: 0, 7: 255, 8: 0
      },
      fadeTime: 0,
      color: '#ff0000'
    },
    {
      name: 'Purple Haze',
      description: 'Deep purple ambiance',
      universe: 1,
      channels: {
        1: 180, 2: 0, 3: 255, 4: 180,
        5: 0, 6: 255, 7: 180, 8: 0
      },
      fadeTime: 4,
      color: '#9b59b6'
    },
    {
      name: 'Sunset Orange',
      description: 'Warm sunset glow',
      universe: 1,
      channels: {
        1: 255, 2: 140, 3: 50, 4: 255,
        5: 140, 6: 50, 7: 255, 8: 140
      },
      fadeTime: 5,
      color: '#ff8c00'
    }
  ];

  demoScenes.forEach(scene => createScene(scene));
};

export const seedDemoGroups = (createGroup) => {
  const demoGroups = [
    {
      name: 'Stage Wash',
      description: 'Main stage wash lights',
      channels: [1, 2, 3, 4],
      color: '#3b82f6',
      fixtureType: 'rgb'
    },
    {
      name: 'Back Lights',
      description: 'Rear uplighting',
      channels: [5, 6, 7, 8],
      color: '#a855f7',
      fixtureType: 'rgb'
    },
    {
      name: 'Front Spots',
      description: 'Front spotlight array',
      channels: [9, 10, 11, 12],
      color: '#eab308',
      fixtureType: 'dimmer'
    },
    {
      name: 'Side Fill',
      description: 'Side fill lighting',
      channels: [13, 14, 15, 16],
      color: '#ec4899',
      fixtureType: 'rgb'
    }
  ];

  demoGroups.forEach(group => createGroup(group));
};

export const seedDemoChases = (createChase) => {
  const demoChases = [
    {
      name: 'Rainbow Fade',
      description: 'Smooth rainbow color transition',
      steps: [
        { channels: { 1: 255, 2: 0, 3: 0, 4: 255, 5: 0, 6: 0 }, fadeTime: 1000 }, // Red
        { channels: { 1: 255, 2: 127, 3: 0, 4: 255, 5: 127, 6: 0 }, fadeTime: 1000 }, // Orange
        { channels: { 1: 255, 2: 255, 3: 0, 4: 255, 5: 255, 6: 0 }, fadeTime: 1000 }, // Yellow
        { channels: { 1: 0, 2: 255, 3: 0, 4: 0, 5: 255, 6: 0 }, fadeTime: 1000 }, // Green
        { channels: { 1: 0, 2: 0, 3: 255, 4: 0, 5: 0, 6: 255 }, fadeTime: 1000 }, // Blue
        { channels: { 1: 148, 2: 0, 3: 211, 4: 148, 5: 0, 6: 211 }, fadeTime: 1000 } // Purple
      ],
      speed: 2000,
      fadeTime: 1000,
      loop: true,
      color: '#ff00ff'
    },
    {
      name: 'Strobe Flash',
      description: 'Fast strobe effect',
      steps: [
        { channels: { 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255 }, fadeTime: 0 }, // Full white
        { channels: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }, fadeTime: 0 } // Blackout
      ],
      speed: 100,
      fadeTime: 0,
      loop: true,
      color: '#ffffff'
    },
    {
      name: 'Wave Effect',
      description: 'Cascading wave across fixtures',
      steps: [
        { channels: { 1: 255, 2: 100, 3: 0, 4: 0, 5: 0, 6: 0 }, fadeTime: 300 },
        { channels: { 1: 100, 2: 255, 3: 100, 4: 0, 5: 0, 6: 0 }, fadeTime: 300 },
        { channels: { 1: 0, 2: 100, 3: 255, 4: 100, 5: 0, 6: 0 }, fadeTime: 300 },
        { channels: { 1: 0, 2: 0, 3: 100, 4: 255, 5: 100, 6: 0 }, fadeTime: 300 },
        { channels: { 1: 0, 2: 0, 3: 0, 4: 100, 5: 255, 6: 100 }, fadeTime: 300 },
        { channels: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100, 6: 255 }, fadeTime: 300 }
      ],
      speed: 500,
      fadeTime: 300,
      loop: true,
      color: '#00ffff'
    }
  ];

  demoChases.forEach(chase => createChase(chase));
};

export const seedDemoSchedules = (createSchedule) => {
  const demoSchedules = [
    {
      name: 'Morning Warm Up',
      enabled: true,
      sceneId: null, // Will need to link to actual scene IDs
      time: '08:00',
      days: [1, 2, 3, 4, 5], // Mon-Fri
      fadeTime: 3
    },
    {
      name: 'Evening Ambiance',
      enabled: true,
      sceneId: null,
      time: '18:00',
      days: [0, 1, 2, 3, 4, 5, 6], // Daily
      fadeTime: 5
    },
    {
      name: 'Night Off',
      enabled: true,
      sceneId: null,
      time: '23:00',
      days: [0, 1, 2, 3, 4, 5, 6], // Daily
      fadeTime: 2
    },
    {
      name: 'Weekend Party Mode',
      enabled: false,
      chaseId: null, // Will need to link to actual chase IDs
      time: '20:00',
      days: [5, 6], // Fri-Sat
      fadeTime: 1
    }
  ];

  demoSchedules.forEach(schedule => createSchedule(schedule));
};

export const seedAllDemoData = (stores) => {
  const { sceneStore, groupStore, chaseStore, scheduleStore } = stores;
  
  // Check if already seeded
  if (localStorage.getItem('aether-dmx-seeded') === 'true') {
    console.log('Demo data already seeded');
    return;
  }

  console.log('Seeding demo data...');
  
  seedDemoScenes(sceneStore.createScene);
  seedDemoGroups(groupStore.createGroup);
  seedDemoChases(chaseStore.createChase);
  seedDemoSchedules(scheduleStore.createSchedule);
  
  localStorage.setItem('aether-dmx-seeded', 'true');
  console.log('✅ Demo data seeded successfully!');
};
