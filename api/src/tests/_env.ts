/**
 * Test env bridge
 *
 * Keeps existing imports stable while delegating all parsing/defaults
 * to the shared config/env module.
 */

export { env, envSchema, parseEnv, type Env } from '../../../config/env.js';
