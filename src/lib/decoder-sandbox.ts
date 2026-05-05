/**
 * PAYLOAD DECODER SANDBOX
 * 
 * This utility executes user-provided JavaScript snippets to transform
 * raw hexadecimal or JSON payloads into structured measurement data.
 */

export interface DecoderResult {
  data: Record<string, unknown>;
  warnings?: string[];
  error?: string;
}

export function executeDecoder(code: string, payload: unknown): DecoderResult {
  try {
    // Basic sandbox using a Function constructor
    // In production, this should be replaced by a more secure VM (e.g., isolated-vm or vm2)
    const decoder = new Function('bytes', 'payload', `
      "use strict";
      ${code}
      // Expecting a 'Decode' function or a direct return
      if (typeof Decode === 'function') {
        return Decode(bytes, payload);
      }
      return {};
    `);

    // Prepare inputs
    const bytes = typeof payload === 'string' 
      ? Array.from(Buffer.from(payload, 'hex'))
      : (payload instanceof Buffer ? Array.from(payload) : []);

    const result = decoder(bytes, payload);

    return {
      data: result as Record<string, unknown> || {},
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      data: {},
      error: `Decoder execution failed: ${error.message}`,
    };
  }
}

/**
 * Example Decoder Logic (for user reference):
 * 
 * function Decode(bytes, payload) {
 *   return {
 *     temperature: (bytes[0] << 8 | bytes[1]) / 100,
 *     humidity: bytes[2]
 *   };
 * }
 */
