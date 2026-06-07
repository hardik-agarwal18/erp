import fs from "fs/promises";
import path from "path";
import autocannon, { Options, Result } from "autocannon";
import { config } from "dotenv";

config(); // Load .env

const BASE_URL = process.env.LOAD_TEST_BASE_URL || "http://localhost:5000/api/v1";
const CONNECTIONS = parseInt(process.env.LOAD_TEST_CONNECTIONS || "50", 10);
const DURATION = parseInt(process.env.LOAD_TEST_DURATION || "10", 10);
const EMAIL = process.env.LOAD_TEST_EMAIL;
const PASSWORD = process.env.LOAD_TEST_PASSWORD;

// Configurable thresholds for regression testing
const MAX_LATENCY_P99_MS = 500;
const MIN_REQS_PER_SEC = 100;
const MAX_ERROR_RATE = 0.01; // 1%

const RESULTS_DIR = path.join(process.cwd(), "load-test-results");

export interface Scenario {
  name: string;
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: string;
  headers?: Record<string, string>;
  setup?: (token: string) => Promise<{ headers?: Record<string, string>, body?: string, url?: string }>;
}

async function ensureResultsDir() {
  try {
    await fs.access(RESULTS_DIR);
  } catch {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
  }
}

async function getAuthToken(): Promise<string> {
  if (!EMAIL || !PASSWORD) {
    console.warn("LOAD_TEST_EMAIL or LOAD_TEST_PASSWORD not set. Running unauthenticated.");
    return "";
  }

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Failed to authenticate for load testing. Status: ${res.status}`);
  }

  const data = await res.json();
  return data.data.accessToken;
}

export async function runScenario(scenario: Scenario) {
  console.log(`\n==========================================`);
  console.log(`Starting Load Test: ${scenario.name}`);
  console.log(`==========================================`);

  await ensureResultsDir();

  let token = "";
  if (!scenario.url.includes("/auth/login")) {
    token = await getAuthToken();
  }

  let finalHeaders = {
    "Content-Type": "application/json",
    ...scenario.headers,
  };

  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  let finalUrl = `${BASE_URL}${scenario.url}`;
  let finalBody = scenario.body;

  if (scenario.setup) {
    const overrides = await scenario.setup(token);
    if (overrides.headers) finalHeaders = { ...finalHeaders, ...overrides.headers };
    if (overrides.body) finalBody = overrides.body;
    if (overrides.url) finalUrl = `${BASE_URL}${overrides.url}`;
  }

  const opts: Options = {
    url: finalUrl,
    connections: CONNECTIONS,
    duration: DURATION,
    method: scenario.method || "GET",
    headers: finalHeaders,
    body: finalBody,
  };

  return new Promise<void>((resolve, reject) => {
    autocannon(opts, async (err, result: Result) => {
      if (err) {
        console.error(`Error during load test:`, err);
        return reject(err);
      }

      await printAndSaveReport(scenario.name, result);
      resolve();
    });
  });
}

async function printAndSaveReport(name: string, result: Result) {
  const reportPath = path.join(RESULTS_DIR, `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`);
  await fs.writeFile(reportPath, JSON.stringify(result, null, 2));

  const errorRate = result.errors / (result.requests.sent || 1);

  console.log(`\n--- Results: ${name} ---`);
  console.log(`Connections: ${result.connections}, Duration: ${result.duration}s`);
  console.log(`Requests/sec: ${result.requests.average}`);
  console.log(`Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/sec`);
  console.log(`Latency (Avg): ${result.latency.average} ms`);
  console.log(`Latency (p97.5): ${result.latency.p97_5} ms`);
  console.log(`Latency (p99): ${result.latency.p99} ms`);
  console.log(`Errors: ${result.errors} (${(errorRate * 100).toFixed(2)}%)`);
  console.log(`Report saved to: ${reportPath}`);

  // Regression assertions
  let failed = false;
  if (result.latency.p99 > MAX_LATENCY_P99_MS) {
    console.error(`❌ REGRESSION: p99 Latency (${result.latency.p99}ms) exceeds threshold (${MAX_LATENCY_P99_MS}ms)`);
    failed = true;
  }
  if (result.requests.average < MIN_REQS_PER_SEC) {
    console.error(`❌ REGRESSION: Requests/sec (${result.requests.average}) is below threshold (${MIN_REQS_PER_SEC})`);
    failed = true;
  }
  if (errorRate > MAX_ERROR_RATE) {
    console.error(`❌ REGRESSION: Error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold (${(MAX_ERROR_RATE * 100).toFixed(2)}%)`);
    failed = true;
  }

  if (failed) {
    console.error(`\nLoad test failed regression checks.`);
    process.exit(1);
  } else {
    console.log(`✅ All regression checks passed.`);
  }
}

// If executed directly, we could run a default suite or just print a message
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Use the specific scenario scripts to run load tests. Example: npm run test:load:auth");
  console.log("Alternatively, you can import runScenario from this file to build custom suites.");
}
