import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  // Files to ignore globally
  { ignores: ['dist', 'node_modules'] },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript strict + stylistic rules (type-aware)
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    // Type-aware rules need the tsconfig
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },

    rules: {
      // ── React Hooks ───────────────────────────────────────────────────────
      ...reactHooks.configs.recommended.rules,

      // ── React Refresh (Vite HMR) ──────────────────────────────────────────
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // ── TypeScript tweaks ─────────────────────────────────────────────────
      // Prefer `import type` for type-only imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Disallow `any` — use `unknown` + narrowing instead
      '@typescript-eslint/no-explicit-any': 'error',
      // Allow void-returning arrow functions (e.g. event handlers)
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
)
