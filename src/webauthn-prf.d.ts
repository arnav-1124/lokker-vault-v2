/**
 * Type augmentations for WebAuthn PRF (Pseudo-Random Function) extension.
 * The PRF extension allows hardware authenticators to derive deterministic
 * symmetric keys, which Lokker uses as a Key Encryption Key (KEK).
 */

interface WebAuthnPRFInputs {
  eval?: {
    first: BufferSource;
    second?: BufferSource;
  };
  evalByCredential?: Record<
    string,
    { first: BufferSource; second?: BufferSource }
  >;
}

interface WebAuthnPRFOutputs {
  enabled?: boolean;
  results?: {
    first?: ArrayBuffer;
    second?: ArrayBuffer;
  };
}

interface PublicKeyCredentialCreationOptionsExtensions {
  prf?: WebAuthnPRFInputs;
}

interface PublicKeyCredentialRequestOptionsExtensions {
  prf?: WebAuthnPRFInputs;
}

interface AuthenticatorAttestationResponse {
  readonly clientExtensionResults: () => {
    prf?: WebAuthnPRFOutputs;
    [key: string]: unknown;
  };
}

interface AuthenticatorAssertionResponse {
  readonly clientExtensionResults: () => {
    prf?: WebAuthnPRFOutputs;
    [key: string]: unknown;
  };
}
