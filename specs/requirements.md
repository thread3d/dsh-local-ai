# dsh-local-ai Requirements Specification

## Overview

dsh-local-ai is a DeepSeek Harness plugin that provides local-model (Ollama) integration. It enables users to discover, pull, remove, and inspect local models, route requests to them with automatic cloud fallback, and monitor system health.

## Functional Requirements

### FR-1: Model Discovery and Management

The plugin MUST provide tools for managing local Ollama models:

- **FR-1.1**: `ollama_list` - List all installed models with disk usage information
- **FR-1.2**: `ollama_show` - Display detailed information about a specific model (parameters, quantization, context length)
- **FR-1.3**: `ollama_pull` - Download a new model from Ollama
- **FR-1.4**: `ollama_remove` - Remove an installed model

### FR-2: Health Monitoring

The plugin MUST provide health monitoring capabilities:

- **FR-2.1**: API health check via HTTP `/api/version` endpoint
- **FR-2.2**: Process health check via `ollama list` CLI probe
- **FR-2.3**: Report health as two independent signals (API and process)

### FR-3: Model Routing

The plugin MUST route requests to local models:

- **FR-3.1**: Route by purpose (task type)
- **FR-3.2**: Route by case-insensitive keyword matching
- **FR-3.3**: Route by explicit `always` rule
- **FR-3.4**: Automatic fallback to cloud provider when local route fails before content generation
- **FR-3.5**: First-match-wins routing policy

### FR-4: Ollama Adapter

The plugin MUST implement an Ollama LLM adapter:

- **FR-4.1**: Register adapter under `ollama` provider name
- **FR-4.2**: Support text-only input modality
- **FR-4.3**: Support tool calls and tool results
- **FR-4.4**: Translate harness messages to Ollama wire format
- **FR-4.5**: Translate Ollama NDJSON streams to StreamChunks
- **FR-4.6**: Configure model mapping, temperature, max-tokens, stop sequences

### FR-5: OpenAI-Compatible Backends

The plugin MUST support OpenAI-compatible backends:

- **FR-5.1**: Support LM Studio, vLLM, llama.cpp `--server`
- **FR-5.2**: Register as `openai:<name>` provider
- **FR-5.3**: Use OpenAI `/v1/chat/completions` API

### FR-6: Command Interface

The plugin MUST provide `/ollama` command:

- **FR-6.1**: Display installed models
- **FR-6.2**: Display disk usage
- **FR-6.3**: Display health status
- **FR-6.4**: Provide usage suggestions
- **FR-6.5**: Never throw on server unavailability (best-effort)

## Non-Functional Requirements

### NFR-1: Configuration

- **NFR-1.1**: All configuration must be validated at mount time
- **NFR-1.2**: Default `baseURL`: `http://127.0.0.1:11434`
- **NFR-1.3**: Default `requestTimeoutMs`: `30000`
- **NFR-1.4**: Default `graceMs`: `15000`
- **NFR-1.5**: Default `defaultContextWindow`: `8192`
- **NFR-1.6**: Default `maxTokens`: `4096`

### NFR-2: Error Handling

- **NFR-2.1**: Invalid configuration must fail the mount
- **NFR-2.2**: Local route failures before content must fallback to cloud
- **NFR-2.3**: Mid-stream failures must be forwarded (cannot retract)
- **NFR-2.4**: `IMAGE_OFFLOAD_REQUIRED` errors must never fallback to cloud

### NFR-3: Security

- **NFR-3.1**: Sanitize endpoint addresses before display
- **NFR-3.2**: Sanitize local paths before display
- **NFR-3.3**: Redact userinfo/secret-query from URLs
- **NFR-3.4**: Strip control characters from output
- **NFR-3.5**: Enforce length bounds on sanitized output

### NFR-4: Performance

- **NFR-4.1**: Zero external dependencies (only global fetch)
- **NFR-4.2**: CLI used only for process probe
- **NFR-4.3**: No model files bundled

### NFR-5: Compatibility

- **NFR-5.1**: Node.js ^22.19.0 || >=24.0.0
- **NFR-5.2**: DeepSeek Harness >=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0 || >=0.1.7-0 <0.2.0 || >=0.2.0-0 <0.3.0 || >=0.2.1-0 <0.3.0

### NFR-6: Code Quality

- **NFR-6.1**: TypeScript strict mode
- **NFR-6.2**: Coverage gates: 90/80/90/90 (statements/branches/functions/lines)
- **NFR-6.3**: Self-contained verification
- **NFR-6.4**: Artifacts verification
- **NFR-6.5**: Lockfile drift check
- **NFR-6.6**: Multi-language README sync (5 languages)

## Architecture Constraints

### AC-1: Plugin Structure

- Plugin entry point at `src/index.ts`
- No default export (uses `exports.default ?? exports` pattern)
- All contributions via Cordis effects (`register()`/`on()`)
- Stop/HMR withdraws all registrations

### AC-2: Module Organization

- `src/config.ts` - Configuration schema and validation
- `src/adapter.ts` - OllamaAdapter implementation
- `src/serialize.ts` - Message serialization (harness → Ollama)
- `src/translate.ts` - Stream translation (Ollama NDJSON → StreamChunk)
- `src/ollama.ts` - HTTP client for Ollama API
- `src/health.ts` - Health checking
- `src/route.ts` - Routing logic
- `src/sanitize.ts` - Output sanitization
- `src/openai-adapter.ts` - OpenAI-compatible backend adapter
- `src/openai-serialize.ts` - OpenAI message serialization
- `src/openai-translate.ts` - OpenAI stream translation

### AC-3: Testing

- Vitest test framework
- Tests in `test/` directory
- Real Context/LlmRuntime/SystemPrompt/ToolRuntime/CommandRuntime
- Network edge mocked (global fetch)

## Interface Specifications

### Tool: ollama_list

**Input**: `{}`  
**Output**: Text summary of installed models with disk usage

### Tool: ollama_show

**Input**: `{ name: string }`  
**Output**: Model details (parameters, quantization, context length)

### Tool: ollama_pull

**Input**: `{ name: string }`  
**Output**: Pull status and progress

### Tool: ollama_remove

**Input**: `{ name: string }`  
**Output**: Removal confirmation

### Command: /ollama

**Input**: None  
**Output**: Status overview (models, disk usage, health, suggestions)

## Failure Modes

### FM-1: Server Unavailable

- API health: `ok: false`, error message
- Process health: `present: false`, error message
- `/ollama` command: best-effort display, never throws

### FM-2: Model Not Found

- Routing fails, triggers cloud fallback
- Error message indicates model not available locally

### FM-3: Image Input

- Rejected with `IMAGE_OFFLOAD_REQUIRED` error
- Never attempts cloud fallback

### FM-4: Configuration Error

- Invalid URL format
- Numeric bounds violation
- Duplicate model names
- Rule-less routes
- Mount fails with descriptive error

## Success Criteria

1. All tools function correctly with running Ollama server
2. Health checks report accurate status
3. Routing rules apply as configured
4. Cloud fallback works when local fails
5. All tests pass with coverage >= 90/80/90/90
6. Build artifacts are self-contained
7. No lockfile drift
8. Multi-language README in sync

## CodeWitness Verification Status (as of 2026-10-30)

### Current Status: BLOCKED

The CodeWitness verification run `CW-2026-10-30-F6AQ5` was BLOCKED due to a build failure in the sandbox environment.

**Blocking Issue**: The CodeWitness TypeScript sandbox uses Node.js's experimental `stripTypeScriptTypes` feature which does not support TypeScript parameter properties. This causes all files with parameter properties (e.g., `src/adapter.ts`, `src/openai-adapter.ts`) to fail syntax checking.

**Evidence**: 
```
SyntaxError: TypeScript parameter property is not supported in strip-only mode
at src/adapter.ts:76
at src/openai-adapter.ts:39
```

**Resolution Path**:
1. The project's regular build and test pipeline works correctly with pnpm/vitest
2. CodeWitness TypeScript support needs to either:
   - Upgrade to full TypeScript compilation support, or
   - Support parameter properties in the strip-only mode
3. For now, verification relies on:
   - The existing Vitest test suite (run with `pnpm test`)
   - Manual inspection of source code
   - Static analysis by CodeWitness (which runs successfully)

### Requirements Verdict

All 19 requirements are currently **BLOCKED** due to the build failure:
- Functional Requirements (FR-1 through FR-6)
- Non-Functional Requirements (NFR-1 through NFR-6)  
- Architecture Constraints (AC-1 through AC-3)
- Failure Modes (FM-1 through FM-4)

### Counterexamples Generated

CodeWitness generated 3 counterexamples that failed during test generation:
- CE-001: FR-1 scenario failed (ollama_list)
- CE-002: FR-3 scenario failed (route by keyword)
- CE-003: FR-6 scenario failed (/ollama command)

These failures are infrastructure-related (build cannot succeed), not code defects.

---

## Appendix: Auto-Generated Starter Requirements

The following requirements were generated by `codewitness init` as a template. They do not apply to dsh-local-ai and are retained here only as a reference for what the auto-generation produced:

# R-001 Withdrawal limit

A customer may withdraw at most 1,000 during any rolling 24-hour period.
A withdrawal that would exceed the limit must be rejected.
The system must behave correctly when multiple withdrawal requests occur concurrently.

# R-002 Negative amounts

A withdrawal of a negative amount must be rejected.

# R-003 Rolling window

The limit applies to a rolling 24-hour window, not to a calendar day. A withdrawal at
23:30 followed by a withdrawal at 00:30 the next day must respect the same limit.
