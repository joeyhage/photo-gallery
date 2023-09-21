import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { Either } from "fp-ts/Either";
import { NonEmptyArray } from "fp-ts/NonEmptyArray";
import * as O from "fp-ts/Option";
import { Option } from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { constant, flow, identity, pipe } from "fp-ts/lib/function";
import { NextApiRequest } from "next";
import { Pattern, match } from "ts-pattern";
import {
  ALBUM_ID_PARAM,
  BASE_PHOTO_URL,
  DEFAULT_OFFSET,
  DEFAULT_PHOTOS_LIMIT,
  LIMIT_PARAM,
  MAX_PHOTOS_LIMIT,
  OFFSET_PARAM,
} from "./constants";
import { Photo, ValidatedPhotoRequestParams } from "./domain";
import {
  BadPhotoResponse,
  NoPhotosFound,
  RequestFailed,
  ValidationError,
} from "./error";

const invalidAlbumIdError = new ValidationError(
  "Invalid album id provided. Album id must be a non-negative integer",
  ALBUM_ID_PARAM
);

const invalidOffsetError = new ValidationError(
  "Invalid offset provided. Offset must be a non-negative integer",
  OFFSET_PARAM
);

const invalidLimitError = new ValidationError(
  `Invalid limit provided. Limit must be a non-negative integer less than or equal to ${MAX_PHOTOS_LIMIT} and only one limit is allowed`,
  LIMIT_PARAM
);

export const extractParamsFor = (
  nextReq: NextApiRequest,
  key: string
): Option<string | string[]> =>
  key in nextReq.query ? O.fromNullable(nextReq.query[key]) : O.none;

export const fetcher = (url: string) =>
  TE.tryCatch(
    () =>
      fetch(url, { next: { revalidate: 3600 } }).then((r) =>
        r.ok ? r.json() : Promise.reject(`HTTP ${r.status} ${r.statusText}`)
      ),
    (e) => new RequestFailed(`Request to ${url} failed`, e)
  );

export const validatePhotoRequest = (
  maybeAlbumIds: Option<string | string[]>,
  maybeOffsets: Option<string | string[]>,
  maybeLimits: Option<string | string[]>
): Either<NonEmptyArray<ValidationError>, ValidatedPhotoRequestParams> => {
  const maybeAlbumIdError = pipe(
    maybeAlbumIds,
    O.map((albumIds) => (typeof albumIds === "string" ? albumIds.split(',') : albumIds)),
    O.map(A.some((albumId) => validateNumber(albumId, 0))),
    O.flatMap((valid) => (valid ? O.none : O.of(invalidAlbumIdError)))
  );

  const maybeOffsetError = pipe(
    maybeOffsets,
    O.flatMap((offsets) =>
      validateNumber(offsets, 0) ? O.none : O.of(invalidOffsetError)
    )
  );

  const maybeLimitError = pipe(
    maybeLimits,
    O.flatMap((limits) =>
      validateNumber(limits, 0, MAX_PHOTOS_LIMIT)
        ? O.none : O.of(invalidLimitError)
    )
  );

  return pipe(
    [maybeAlbumIdError, maybeOffsetError, maybeLimitError],
    A.filterMap(identity),
    A.match(
      () =>
        E.of({
          albumIds: pipe(
            maybeAlbumIds,
            O.map(ai => typeof ai === 'string' ? ai.split(',') : ai),
            O.map(A.filterMap(n => n.trim().length > 0 ? O.of(n) : O.none)),
          ),
          offset: pipe(
            maybeOffsets as Option<string>,
            O.filterMap(n => n.trim().length > 0 ? O.of(n) : O.none),
            O.map((n) => +n),
            O.getOrElse(constant(DEFAULT_OFFSET))
          ),
          limit: pipe(
            maybeLimits as Option<string>,
            O.filterMap(n => n.trim().length > 0 ? O.of(n) : O.none),
            O.map((n) => +n),
            O.getOrElse(constant(DEFAULT_PHOTOS_LIMIT))
          ),
        }),
      E.left
    )
  );
};

export const albumIdsToRequestUrl = (
  maybeAlbumIds: Option<string[]>
) =>
  pipe(
    maybeAlbumIds,
    O.filterMap(
      flow(
        A.map((albumId) => albumId.trim()),
        A.filter((albumId) => albumId.length > 0),
        A.map((albumId) => [ALBUM_ID_PARAM, albumId]),
        A.match(constant(O.none), O.of)
      )
    ),
    O.match(
      () => BASE_PHOTO_URL,
      (albumIds) => `${BASE_PHOTO_URL}?${new URLSearchParams(albumIds)}`
    )
  );

export const validatePhotoResponse = (
  response: unknown
): Either<BadPhotoResponse, NonEmptyArray<Photo>> =>
  match(response)
    .with(
      Pattern.array({
        albumId: Pattern.number,
        id: Pattern.number,
        title: Pattern.string,
        url: Pattern.string,
        thumbnailUrl: Pattern.string,
      }),
      (res) =>
        res.length > 0
          ? E.of(res as NonEmptyArray<Photo>)
          : E.left(new NoPhotosFound())
    )
    .otherwise(constant(E.left(new BadPhotoResponse())));

const validateNumber = (
  values: string | string[],
  min?: number,
  max?: number
) => {
  const value = typeof values === "string" ? +values : NaN;
  return (
    !isNaN(value) &&
    Number.isInteger(value) &&
    (typeof min === 'undefined' || value >= min) &&
    (typeof max === 'undefined' || value <= max)
  );
};
