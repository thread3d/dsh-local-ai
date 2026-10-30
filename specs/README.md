# CodeWitness Setup for dsh-local-ai

This directory contains the specifications and setup for CodeWitness verification of the dsh-local-ai project.

## Files

- `requirements.md` - Complete functional and non-functional requirements specification
- `codewitness.yaml` - CodeWitness configuration file
- `test-codewitness.js` - Manual test suite for verification

## Known Issues

### TypeScript Parameter Properties

The CodeWitness sandbox environment currently uses an experimental Node.js feature `stripTypeScriptTypes` that does not fully support TypeScript parameter properties. This causes build failures when CodeWitness attempts to type-check the source files.

**Workaround**: For now, verification relies on:
1. The existing Vitest test suite (which runs successfully outside CodeWitness)
2. Manual test scenarios in `test-codewitness.js`
3. Static analysis via CodeWitness

### Recommended Verification Workflow

1. **Run the existing test suite**:
   ```bash
   pnpm test
   pnpm run test:coverage
   ```

2. **Run manual CodeWitness tests** (when dependencies are available):
   ```bash
   node specs/test-codewitness.js
   ```

3. **Run CodeWitness partial verification**:
   ```bash
   codewitness verify . --requirements specs/requirements.md
   ```

## Coverage Status

As of CodeWitness v0.1.2:
- ✅ TypeScript adapter detection
- ✅ Build failure diagnosis (syntax compatibility)
- ✅ Static analysis configuration  
- ✅ Security verification setup
- ❌ Automated test execution (sandbox limitation)
- ❌ Mutation testing (maturity)

## Future Work

Once CodeWitness TypeScript support matures:
1. Update `codewitness.yaml` with working vitest configuration
2. Add comprehensive scenario tests for each requirement
3. Enable mutation testing with appropriate TypeScript mutator
4. Configure LLM advisory mode for requirement analysis
