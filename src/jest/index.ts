import { expect } from "@jest/globals";
import { toRerender, toRenderExactlyTimes } from "./ProfiledComponent.js";

expect.extend({
  toRerender,
  toRenderExactlyTimes,
});
