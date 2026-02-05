import { describe, expect, it } from "vitest";
import { GetNonce } from "../src/utils/nonce";

const NONCE_PATTERN = /^[A-Za-z0-9]{32}$/;

describe("GetNonce", () => {
  it("returns a 32-character alphanumeric string", () => {
    const nonce = GetNonce();

    expect(nonce).toHaveLength(32);
    expect(nonce).toMatch(NONCE_PATTERN);
  });
});
