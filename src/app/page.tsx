import PlaceTypeahead from "../components/PlaceTypehead";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 px-6 py-20">
      <main className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-semibold text-zinc-900">
          City Typeahead
        </h1>
        <p className="mb-8 text-sm text-zinc-500">
          Debounced autocomplete search against the free, no-auth{" "}
          <a
            className="underline"
            href="https://open-meteo.com/en/docs/geocoding-api"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open-Meteo Geocoding API
          </a>
          .
        </p>
        <PlaceTypeahead />
      </main>
    </div>
  );
}
