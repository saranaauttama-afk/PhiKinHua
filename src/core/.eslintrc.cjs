/** ESLint guardrails for deterministic core */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { es2021: true, node: true },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.expo/', 'android/', 'ios/'],
  overrides: [
    {
      files: ['src/core/**/*.{ts,tsx}'],
      rules: {
        // ❌ ห้ามสุ่ม/เวลาใน core
        'no-restricted-properties': ['error',
          { object: 'Math', property: 'random', message: 'Use rng.ts only in core' },
          { object: 'Date', property: 'now', message: 'Determinism: timestamps only in UI layer' },
          { object: 'performance', property: 'now', message: 'Determinism: no timers in core' }
        ],
        'no-restricted-globals': ['error',
          { name: 'setTimeout', message: 'No timers in core' },
          { name: 'setInterval', message: 'No timers in core' },
          { name: 'clearTimeout', message: 'No timers in core' },
          { name: 'clearInterval', message: 'No timers in core' },
          { name: 'queueMicrotask', message: 'No async scheduling in core' }
        ],
        // ❌ core ห้าม import ฝั่ง UI/React/Expo และยูทิล UI
        'no-restricted-imports': ['error', {
          paths: [
            { name: 'react', message: 'Core must be pure (no React in src/core)' },
            { name: 'react-native', message: 'Core must be pure (no RN in src/core)' },
            { name: 'expo', message: 'Core must be pure' },
            { name: 'expo-router', message: 'Core must be pure' },
          ],
          patterns: [
            '**/src/ui/**',
            '**/ui/**',
            '@/ui/**',
            '**/anim',
            '**/anim/**',
            '**/haptics',
            '**/haptics/**',
            '**/sfx',
            '**/sfx/**',
            '**/theme',
            '**/theme/**'
          ]
        }],
        'no-console': 'error'
      }
    },
    // UI: อนุญาต console ได้
    {
      files: ['src/**/*.{ts,tsx}'],
      rules: { 'no-console': 'off' }
    }
  ]
};
