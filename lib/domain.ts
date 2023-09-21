import { Option } from 'fp-ts/Option';

export interface Photo {
  albumId: number;
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

export interface ValidatedPhotoRequestParams {
  albumIds: Option<string[]>;
  offset: number;
  limit: number;
}
