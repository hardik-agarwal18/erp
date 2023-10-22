import { runScenario, Scenario } from "../load-test.js";

const loginScenario: Scenario = {
  name: "Auth-Login",
  url: "/auth/login",
  method: "POST",
  body: JSON.stringify({
    email: process.env.LOAD_TEST_EMAIL,
    password: process.env.LOAD_TEST_PASSWORD,
  }),
};

// In real execution, we'd only run one scenario at a time or loop them.
runScenario(loginScenario).catch((err) => {
  console.error(err);
  process.exit(1);
});
