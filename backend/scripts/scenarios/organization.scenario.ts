import { runScenario, Scenario } from "../load-test.js";

const orgListScenario: Scenario = {
  name: "Organization-List",
  url: "/organizations",
  method: "GET",
};

runScenario(orgListScenario).catch((err) => {
  console.error(err);
  process.exit(1);
});
