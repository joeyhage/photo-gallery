export class ValidationError extends Error {
  public readonly uiMessage: string;
  constructor(public readonly message: string, public readonly elementId: string) {
    super(message);
    this.name = ValidationError.name;
    this.uiMessage = message;
  }
}

export class BadPhotoResponse extends Error {
  constructor(message?: string, cause?: unknown) {
    super(message);
    this.name = BadPhotoResponse.name;
    this.cause = cause;
  }
}

export class NoPhotosFound extends Error {
  constructor(message?: string) {
    super(message);
    this.name = NoPhotosFound.name;
  }
}

export class RequestFailed extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = RequestFailed.name;
    this.cause = cause;
  }
}
