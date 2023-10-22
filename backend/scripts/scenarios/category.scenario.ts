import { runScenario, Scenario } from "../load-test.js";

const categoryListScenario: Scenario = {
  name: "Category-List",
  url: "/products/categories",
  method: "GET",
};

runScenario(categoryListScenario).catch((err) => {
  console.error(err);
  process.exit(1);
});
