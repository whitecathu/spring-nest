module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['/', '/tools/', '/games/', '/search/'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.85 }],
        'categories:pwa': ['warn', { minScore: 0.5 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci/reports',
    },
  },
};
