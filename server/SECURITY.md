# Security Notes

## Admin Account Creation

To prevent arbitrary elevation to ADMIN, the signup endpoint now requires an invite secret whenever `role` is `ADMIN`.

Request body field: `inviteSecret`
Environment variable: `ADMIN_INVITE_SECRET`

If the secret is missing or mismatched, the API returns HTTP 403.

Rotate the secret periodically and distribute through a secure channel.

## Recommended Production Steps
1. Set a strong `ADMIN_INVITE_SECRET` (min 32 random chars) in the server environment.
2. Remove or restrict any direct admin creation scripts after initial bootstrap.
3. Monitor failed admin signup attempts for abuse.
