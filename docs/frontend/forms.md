# Frontend Forms

## Table of Contents
- [Overview](#overview)
- [Implemented Form Stack](#implemented-form-stack)
- [Observed Form Screens](#observed-form-screens)

## Overview
Implemented forms use:
- `react-hook-form`
- `@hookform/resolvers/zod`
- feature-local Zod schemas in `src/features/*/schema.ts`

## Implemented Form Stack
Pattern:
1. feature schema defined with Zod
2. form component creates `useForm`
3. `zodResolver` validates data
4. submit handlers call feature-local mock service mutations

## Observed Form Screens
- customer form
- vendor form
- product form
- inventory adjustment / inventory management forms
- invoice editor
- purchase order editor
- goods received note form
- bank reconciliation form
