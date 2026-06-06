import { runScenario, Scenario } from "../load-test.js";

const customerListScenario: Scenario = {
  name: "Customer-List",
  url: "/customers",
  method: "GET",
};

runScenario(customerListScenario).catch((err) => {
  console.error(err);
  process.exit(1);
});
