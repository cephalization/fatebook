# Add Profile feature

- [x] Add profile model to prisma schema
  - [x] Execute prisma migration + generate client
- [x] Add profile router to server
- [x] Add profile to server views
  - [x] Generate fate client
- [x] Add profile route to client
- [x] Add profile page to client

## Questions

- useRequest does not re-fire when deps change, so we need to key the content to force a re-render.
  - For example, if you drive useRequest via a userId in the URL, it will not re-fire when the userId changes.
- Is there a more ergonomic way to handle errors in useRequest? For example, if you want to handle a private profile error differently, you have to write a custom error boundary.
- This may just be an issue with the template, but when the user logs in / logs out, the current page does not re-render. Meaning if you are viewing a private profile, then sign out, the private profile is still visible until refresh.

## Old Questions

- How do I handle a resolver that returns data with access control? For example, if a profile is private, we need to check if the user is the owner of the profile. If not, we need to return an error.
- How does the fate client compiler work? Where does it look for the types to generate?
- Opus 4.5 is doing a good job with implementation using AGENTS.md, but I don't quite like that it tries to hand write fate generated code. I added a line to AGENTS.md to make it clear that the fate client should not be manually edited (despite the docs suggesting to do so).
- Does my byId route need to accept an array of ids? If so, can you provide a pre-made input schema for it?
