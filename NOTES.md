## Add Profile feature

- [x] Add profile model to prisma schema
  - [x] Execute prisma migration + generate client
- [x] Add profile router to server
- [ ] Add profile to server views
  - [ ] Generate fate client
- [x] Add profile route to client
- [x] Add profile page to client

## Questions

- How do I handle a resolver that returns data with access control? For example, if a profile is private, we need to check if the user is the owner of the profile. If not, we need to return an error.
- How does the fate client compiler work? Where does it look for the types to generate?
- Opus 4.5 is doing a good job with implementation using AGENTS.md, but I don't quite like that it tries to hand write fate generated code. I added a line to AGENTS.md to make it clear that the fate client should not be manually edited (despite the docs suggesting to do so).
- Does my byId route need to accept an array of ids? If so, can you provide a pre-made input schema for it?
