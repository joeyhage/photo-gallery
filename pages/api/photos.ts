import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import type { NextApiRequest, NextApiResponse } from "next";
import { match } from "ts-pattern";
import { ALBUM_ID_PARAM, LIMIT_PARAM, OFFSET_PARAM } from "../../lib/constants";
import { Photo, ValidatedPhotoRequestParams } from "../../lib/domain";
import {
  albumIdsToRequestUrl,
  extractParamsFor,
  fetcher,
  validatePhotoRequest,
  validatePhotoResponse,
} from "../../lib/util";
import { ValidationError } from "../../lib/error";

export interface PhotoApiResponse {
  photos?: Photo[];
  error?: string;
  validationErrors?: Array<ValidationError>;
}

export default async function handler(
  nextReq: NextApiRequest,
  nextRes: NextApiResponse<PhotoApiResponse>
): Promise<void> {
  if (nextReq.method === "GET") {
    const maybeAlbumIds = extractParamsFor(nextReq, ALBUM_ID_PARAM);
    const maybeOffset = extractParamsFor(nextReq, OFFSET_PARAM);
    const maybeLimit = extractParamsFor(nextReq, LIMIT_PARAM);

    const validateResult = validatePhotoRequest(
      maybeAlbumIds,
      maybeOffset,
      maybeLimit
    );
    await match(validateResult)
      .with({ _tag: "Left" }, ({ left: validationErrors }) =>
        nextRes.status(400).json({ validationErrors })
      )
      .otherwise(({ right: { albumIds, offset, limit } }) =>
        pipe(
          fetcher(albumIdsToRequestUrl(albumIds)),
          TE.flatMapEither(validatePhotoResponse),
          TE.map((photos) =>
            photos.slice(offset, Math.min(offset + limit, photos.length))
          ),
          TE.match(
            (e) => {
              console.error(
                `Request with ${ALBUM_ID_PARAM}=${albumIds}, ${OFFSET_PARAM}=${offset}, ${LIMIT_PARAM}=${limit} resulted in an error`,
                e,
                e.cause
              );
              nextRes.status(500).json({
                error: `An unexpected error occurred: ${e.name}`,
              });
            },
            (photos) => nextRes.status(200).json({ photos })
          )
        )()
      );
  } else {
    nextRes.statusMessage = "Method Not Allowed";
    nextRes.status(405);
  }
}
