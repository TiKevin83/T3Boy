import { useFileStore } from "../FileStore/useFileStore";

export const TASMovieLoader: React.FC = () => {
  const setGbiMovie = useFileStore((state) => state.setGbiMovie);
  const handleTASChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const gbiMovieFile = e.target.files?.[0];
    if (gbiMovieFile) {
      void gbiMovieFile.text().then((movieFileText) => {
        setGbiMovie(movieFileText);
      });
    } else {
      setGbiMovie(null);
    }
  };

  return (
    <div>
      <label
        className="mt-2 block text-sm font-medium text-white"
        htmlFor="tasMovie"
      >
        TAS Input Log - GBI Format
      </label>
      <input
        type="file"
        onChange={handleTASChange}
        className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
        id="tasMovie"
      />
      <button
        onClick={() => {
          setGbiMovie(null);
        }}
        className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
      >
        Unload TAS
      </button>
    </div>
  );
};
