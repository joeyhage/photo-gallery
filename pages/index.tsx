import Image from "next/image";
import { useEffect, useState } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { ResponsiveType } from "react-multi-carousel/lib/types";
import Input from "../components/input";
import loading from "../public/loading.svg";
import loadingBtn from "../public/loading-button.svg";
import { PhotoApiResponse } from "./api/photos";
import styles from "./styles.module.css";

const BreakpointSlides: ResponsiveType = {
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 3,
  },
  tablet: {
    breakpoint: { max: 1024, min: 530 },
    items: 2,
  },
  mobile: {
    breakpoint: { max: 530, min: 0 },
    items: 1,
  },
};

interface FormState extends Record<string, string> {
  albumId: string;
  offset: string;
  limit: string;
}

export default function Page() {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [formState, setFormState] = useState<FormState>({
    albumId: "",
    offset: "0",
    limit: "25",
  });
  const [photos, setPhotos] = useState<PhotoApiResponse["photos"] | undefined>(
    undefined
  );
  const [error, setError] = useState<PhotoApiResponse["error"] | undefined>(
    undefined
  );
  const [validationErrors, setValidationErrors] = useState<
    PhotoApiResponse["validationErrors"] | undefined
  >(undefined);

  const retrievePhotos = () => {
    setLoading(true);
    setError(undefined);
    setValidationErrors(undefined);
    const params = new URLSearchParams(formState).toString();
    fetch(`/api/photos?${params}`)
      .then((r) => r.json())
      .then((j: PhotoApiResponse) => {
        if (!!j.photos) {
          setPhotos(j.photos);
        }
        setError(j.error);
        setValidationErrors(j.validationErrors);
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    retrievePhotos();
  };

  const updateFormState = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.persist();
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    retrievePhotos();
  }, []);

  return !photos && isLoading ? (
    <div className={styles["loading-spinner"]}>
      <Image
        alt="loading"
        src={loading}
        priority
        width={150}
        height={150}
        className={styles["loading-spinner-svg"]}
      />
    </div>
  ) : (
    <div className="w-full mx-auto px-4 pt-8 sm:w-11/12 lg:w-3/4 xl:w-2/3">
      {!!photos && (
        <Carousel responsive={BreakpointSlides} itemClass="carousel-item">
          {photos.map((p) => (
            <Image
              key={p.id}
              alt={p.title}
              src={p.url}
              priority
              width={600}
              height={600}
            />
          ))}
        </Carousel>
      )}
      <div className="py-4">
        {!!error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      </div>
      <form onSubmit={handleSubmit}>
        <Input
          name="albumId"
          label="Which album do you want to view?"
          placeholder="e.g. 1"
          value={formState.albumId}
          onChange={updateFormState}
          errors={validationErrors}
        />
        <Input
          name="offset"
          label="How many photos do you want to skip from the beginning of the album?"
          value={formState.offset}
          onChange={updateFormState}
          errors={validationErrors}
        />
        <Input
          name="limit"
          label="How many photos do you want to see from the album?"
          value={formState.limit}
          onChange={updateFormState}
          errors={validationErrors}
        />
        {isLoading ? (
          <button className="btn bg-slate-200 hover:bg-slate-300" disabled type="button">
            <Image
              alt="loading"
              src={loadingBtn}
              priority
              width={20}
              height={20}
              className="inline-block mr-2"
            />
            Loading...
          </button>
        ) : (
          <button className="btn bg-emerald-500 hover:bg-emerald-600" name="view-photos" type="submit">
            View Photos
          </button>
        )}
      </form>
    </div>
  );
}
