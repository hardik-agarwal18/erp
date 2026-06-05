# Backend Error Handling

## Table of Contents
- [Overview](#overview)
- [Implemented Error Types](#implemented-error-types)
- [Response Format](#response-format)

## Overview
Errors are normalized through:
- `ApiError`
- `asyncHandler`
- `errorMiddleware`

## Implemented Error Types
### `ApiError`
- custom status code
- message
- optional details payload

### Unhandled errors
- logged through `utils/logger.ts`
- returned as `500 Internal server error`

## Response Format
Validation/auth/business errors return:
```json
{
  "success": false,
  "message": "Error message",
  "details": {}
}
```

Unhandled errors return:
```json
{
  "success": false,
  "message": "Internal server error"
}
```
