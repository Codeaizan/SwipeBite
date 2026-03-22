# Server-side Super Admin Setup Token Validation

This API route keeps the setup token on the server side only,
preventing it from being exposed in the client-side bundle.

The client sends { token: ... } and gets back { valid: boolean }.
