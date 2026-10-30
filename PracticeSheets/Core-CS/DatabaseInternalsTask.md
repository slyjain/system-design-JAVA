# Practice: database architecture

Reference: `ToLearn/Core-CS/DatabaseInternalsDocs.md`. These are thinking exercises; no database installation is required.

- Trace a counter read from the browser to the database and back. Which component chooses a query plan?
- The counter starts at `5`. Two requests both read `5`, calculate `5 + 1`, then each writes its result. What is the final value, and why?
- Explain why sending an atomic increment to the database avoids that particular lost update.
