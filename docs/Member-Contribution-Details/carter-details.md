# Individual Contribution Details

## Contributor

**Carter Hofmann**

This file records my individual assignment details for Issue #4, separate
from the shared links in [assignment-deliverables.md](../assignment-deliverables.md).

## Individual implementation evidence

### Missing-skill recommendations

The recommendation feature lets students select a skill not recorded by their
current course mappings and review relevant UNC Charlotte electives and
online practice resources. Recommendations are curated demo data, not official
academic guidance or evidence of verified skill mastery. The interface
provides a missing-skill selector, recommendation groups, resource links, and
an empty state when recommendations are unavailable.

![Missing-skill recommendations](./Carter-Screenshots/isssue-4-recommendedCourses.png)

- [Issue #4 plan](../issue_details/issue-4-plan.md)
- [Issue #4 test results](../issue_details/issue-4-test-results.md)

## Individual testing evidence

The recorded validation for Issue #4 was:

```text
npm test      -> Passed: 7 test files, 32 tests
npm run build -> Passed
```

Acceptance criteria verified:

- Students can select a missing skill and see related learning options.
- Recommendations include electives and practice resources for supported
  skills.
- Online resources have usable links.
- The interface displays an empty state when recommendations are unavailable.

## Database setup and verification

The local PostgreSQL database was configured for Prisma, initialized with the
committed migration, and populated with the illustrative reference data using
the seed script. See the [database setup guide](../database-setup.md) for the
connection configuration and setup commands.

The database API integration test passed:

```text
npm run test:db -> Passed: 1 test
```

The test verified that course selections persist and that database operations
are validated.

![Database setup and passing integration test](./Carter-Screenshots/dbSetupAndTestVerification.png)
