import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { Photo } from "./domain";
import { BadPhotoResponse, NoPhotosFound, RequestFailed } from "./error";
import {
  fetcher,
  albumIdsToRequestUrl,
  validatePhotoResponse,
  validatePhotoRequest,
} from "./util";
import { off } from "process";

describe("fetcher", () => {
  test("should return photo json when successful", async () => {
    // given
    const mockJson = jest.fn(() => Promise.resolve([examplePhoto]));
    const mockFetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: mockJson } as unknown as Response)
    );
    global.fetch = mockFetch;

    // when
    const actual = fetcher("https://example.com")();

    // then
    await expect(actual).resolves.toStrictEqual(E.of([examplePhoto]));
  });

  test("should return error when bad response status", async () => {
    // given
    const mockJson = jest.fn(() => Promise.resolve([examplePhoto]));
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: mockJson,
      } as unknown as Response)
    );
    global.fetch = mockFetch;

    // when
    const actual = fetcher("https://example.com")();

    // then
    await expect(actual).resolves.toStrictEqual(
      E.left(new RequestFailed("Request to https://example.com failed"))
    );
    expect(((await actual) as E.Left<Error>).left.cause).toEqual(
      "HTTP 400 Bad Request"
    );
  });

  test("should return error when fetch rejects", async () => {
    // given
    const mockFetch = jest.fn(() => Promise.reject("kaboom"));
    global.fetch = mockFetch;

    // when
    const actual = fetcher("https://example.com")();

    // then
    await expect(actual).resolves.toStrictEqual(
      E.left(new RequestFailed("Request to https://example.com failed"))
    );
    expect(((await actual) as E.Left<Error>).left.cause).toEqual("kaboom");
  });

  test("should return error when json rejects", async () => {
    // given
    const mockJson = jest.fn(() => Promise.reject("bad json"));
    const mockFetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: mockJson } as unknown as Response)
    );
    global.fetch = mockFetch;

    // when
    const actual = fetcher("https://example.com")();

    // then
    await expect(actual).resolves.toStrictEqual(
      E.left(new RequestFailed("Request to https://example.com failed"))
    );
    expect(((await actual) as E.Left<Error>).left.cause).toEqual("bad json");
  });
});

describe("maybeAlbumIdToRequestUrl", () => {
  test("should map none to photo url without query params", () => {
    // given
    const maybeAlbumId = O.none;

    // when
    const actual = albumIdsToRequestUrl(maybeAlbumId);

    // then
    expect(actual).toEqual("https://jsonplaceholder.typicode.com/photos");
  });

  test("should map empty array to photo url without query params", () => {
    // given
    const maybeAlbumId = O.of([]);

    // when
    const actual = albumIdsToRequestUrl(maybeAlbumId);

    // then
    expect(actual).toEqual("https://jsonplaceholder.typicode.com/photos");
  });

  test("should map array of empty strings to photo url without query params", () => {
    // given
    const maybeAlbumId = O.of(["", "", ""]);

    // when
    const actual = albumIdsToRequestUrl(maybeAlbumId);

    // then
    expect(actual).toEqual("https://jsonplaceholder.typicode.com/photos");
  });

  test("should map string to photo url with one query params", () => {
    // given
    const maybeAlbumId = O.of(["3"]);

    // when
    const actual = albumIdsToRequestUrl(maybeAlbumId);

    // then
    expect(actual).toEqual(
      "https://jsonplaceholder.typicode.com/photos?albumId=3"
    );
  });

  test("should map array to photo url with multiple query params", () => {
    // given
    const maybeAlbumId = O.of(["1", "5"]);

    // when
    const actual = albumIdsToRequestUrl(maybeAlbumId);

    // then
    expect(actual).toEqual(
      "https://jsonplaceholder.typicode.com/photos?albumId=1&albumId=5"
    );
  });
});

describe("validatePhotoRequest", () => {
  test("should return params given all none", () => {
    // given
    const albumIds = O.none;
    const offset = O.none;
    const limit = O.none;

    // when
    const actual = validatePhotoRequest(albumIds, offset, limit);

    // then
    expect(actual).toStrictEqual(
      E.of({ albumIds: O.none, offset: 0, limit: 25 })
    );
  });

  test("should return params given all blank", () => {
    // given
    const albumIds = O.of('  ');
    const offset = O.of('  ');
    const limit = O.of('  ');

    // when
    const actual = validatePhotoRequest(albumIds, offset, limit);

    // then
    expect(actual).toStrictEqual(
      E.of({ albumIds: O.of([]), offset: 0, limit: 25 })
    );
  });

  test("should return params given all params valid", () => {
    // given
    const albumIds = O.of('1');
    const offset = O.of('25');
    const limit = O.of('25');

    // when
    const actual = validatePhotoRequest(albumIds, offset, limit);

    // then
    expect(actual).toStrictEqual(
      E.of({ albumIds: O.of(['1']), offset: 25, limit: 25 })
    );
  });
});

describe("validatePhotoResponse", () => {
  test("should return response given it is valid", () => {
    // given
    const response = [examplePhoto];

    // when
    const actual = validatePhotoResponse(response);

    // then
    expect(actual).toStrictEqual(E.of([examplePhoto]));
  });

  test("should return error given empty array", () => {
    // given
    const response = new Array();

    // when
    const actual = validatePhotoResponse(response);

    // then
    expect(actual).toStrictEqual(E.left(new NoPhotosFound()));
  });

  test("should return error given undefined", () => {
    // given
    const response = undefined;

    // when
    const actual = validatePhotoResponse(response);

    // then
    expect(actual).toStrictEqual(E.left(new BadPhotoResponse()));
  });

  test("should return error given object", () => {
    // given
    const response = {};

    // when
    const actual = validatePhotoResponse(response);

    // then
    expect(actual).toStrictEqual(E.left(new BadPhotoResponse()));
  });

  test("should return error given missing url", () => {
    // given
    const response = [{ ...examplePhoto, url: undefined }];

    // when
    const actual = validatePhotoResponse(response);

    // then
    expect(actual).toStrictEqual(E.left(new BadPhotoResponse()));
  });
});

const examplePhoto: Photo = {
  albumId: 1,
  id: 1,
  title: "accusamus beatae ad facilis cum similique qui sunt",
  url: "https://via.placeholder.com/600/92c952",
  thumbnailUrl: "https://via.placeholder.com/150/92c952",
};
