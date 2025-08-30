// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            // ✅ ตามเอกสาร NativeWind v4: ใส่เป็น "preset" และตั้ง jsxImportSource
            ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
            'nativewind/babel',
        ],
        // ✅ expo-router เป็น plugin และ reanimated ต้องอยู่ "ท้ายสุด"
        plugins: ['expo-router/babel', 'react-native-reanimated/plugin'],
    };
};
