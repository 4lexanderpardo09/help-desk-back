## 2026-01-21: Security Improvements (Ticket Creation)

### Summary
Enhanced security in ticket creation by enforcing user identity from the JWT token rather than trusting the request body.

### Technical Detail
1. **TicketController**:
   - Updated `create` method to inject `@Req()` and extract `req.user.usu_id`.
   - Explicitly overrides `dto.usuarioId` with the authenticated user's ID.
   
2. **DTO Update**:
   - `CreateTicketDto`: Made `usuarioId` optional (`?`) and removed stricter validation constraints to allow the controller to populate it.
   - Updated API documentation (Swagger) to reflect that `usuarioId` is extracted from the token.

### Benefits
- Prevents impersonation attacks where a user could create a ticket on behalf of another user by sending a different `usuarioId` in the body.
- Simplifies frontend logic as it no longer needs to send the user ID.

---

