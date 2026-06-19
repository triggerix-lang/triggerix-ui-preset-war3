import { antfu } from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'dist',
    'node_modules',
    '**/*.md'
  ],
  rules: {
    'style/comma-dangle': ['warn', 'never']
  }
}, {
  files: ['tests/**/*.ts'],
  rules: {
    // 测试中需要把模板字符串字面量（如 `${who}`）作为普通字符串传入被测函数
    'no-template-curly-in-string': 'off'
  }
})
